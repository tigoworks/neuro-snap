import { Request, Response } from 'express';
import { SupabaseService } from '../services/supabase.service';
import { databaseLogger } from '../services/database-logger.service';
import { AIEnhancedAnalysisService } from '../services/ai-enhanced-analysis.service';
import { AnalysisRequest } from '../services/auto-analysis.service';
import logger from '../utils/logger';

interface SurveyAnswer {
  user_survey_id: string;
  question_id: string;
  model_id: string;
  answer: any;
}

interface SurveyQuestion {
  id: string;
  model_id: string;
  question_code: string;
  type: 'single' | 'multiple' | 'scale' | 'text' | 'sorting';
}

interface SortingAnswer {
  order: number[];
}

export class AnswerController {
  private supabaseService: SupabaseService;
  private aiAnalysisService: AIEnhancedAnalysisService;

  constructor() {
    this.supabaseService = SupabaseService.getInstance();
    this.aiAnalysisService = new AIEnhancedAnalysisService();
  }

  // 提交答案 - 带事务控制和自动分析
  async submitAnswers(req: Request, res: Response) {
    const transactionId = databaseLogger.logTransaction('start');
    const startTime = Date.now();
    
    try {
      const data = req.body;

      // 验证数据完整性
      const testTypeInfo = {
        userInfo: { 
          present: !!data.userInfo, 
          pageName: '用户信息页面', 
          description: '基本个人信息填写',
          requiredFields: ['name', 'gender', 'age', 'city', 'occupation', 'education']
        },
        fiveQuestions: { 
          present: !!data.fiveQuestions, 
          pageName: '五问法测试页面', 
          description: '职业发展五问法测试',
          expectedAnswers: 2
        },
        mbti: { 
          present: !!data.mbti, 
          pageName: 'MBTI人格测试页面', 
          description: 'MBTI十六型人格测试',
          expectedAnswers: 8
        },
        bigFive: { 
          present: !!data.bigFive, 
          pageName: '五大人格测试页面', 
          description: '大五人格特质测试',
          expectedAnswers: 10
        },
        disc: { 
          present: !!data.disc, 
          pageName: 'DISC行为测试页面', 
          description: 'DISC行为风格测试',
          expectedAnswers: 8
        },
        holland: { 
          present: !!data.holland, 
          pageName: '霍兰德测试页面', 
          description: '霍兰德职业兴趣测试',
          expectedAnswers: 18
        },
        values: { 
          present: !!data.values, 
          pageName: '价值观测试页面', 
          description: '职业价值观评估测试',
          expectedAnswers: 6
        }
      };

      const missingTests = Object.entries(testTypeInfo)
        .filter(([_, info]) => !info.present)
        .map(([key, info]) => ({
          testType: key,
          pageName: info.pageName,
          description: info.description,
          fieldName: key
        }));

      if (missingTests.length > 0) {
        const detailedMissingInfo = {
          totalMissing: missingTests.length,
          totalRequired: 7,
          missingTests: missingTests,
          presentTests: Object.entries(testTypeInfo)
            .filter(([_, info]) => info.present)
            .map(([key, info]) => ({
              testType: key,
              pageName: info.pageName,
              answerCount: data[key] ? Object.keys(data[key]).length : 0
            })),
          frontendGuidance: {
            message: '请完成以下测试页面',
            missingPages: missingTests.map(test => test.pageName),
            nextAction: '请返回对应页面完成测试后重新提交'
          }
        };

        logger.warn('❌ 答案提交失败：数据不完整', { 
          missingFields: Object.fromEntries(
            Object.entries(testTypeInfo).map(([key, info]) => [key, !info.present])
          ),
          detailedValidation: detailedMissingInfo,
          inputParams: {
            originalRequest: {
              bodyKeys: Object.keys(data),
              hasUserInfo: !!data.userInfo,
              userInfoDetails: data.userInfo ? {
                hasRequiredFields: !!(data.userInfo.name && data.userInfo.gender && data.userInfo.age && 
                                     data.userInfo.city && data.userInfo.occupation && data.userInfo.education),
                presentFields: Object.keys(data.userInfo),
                missingUserInfoFields: ['name', 'gender', 'age', 'city', 'occupation', 'education']
                  .filter(field => !data.userInfo[field])
              } : { error: 'userInfo对象缺失' },
              testAnswerCounts: Object.fromEntries(
                Object.entries(testTypeInfo).map(([key, _]) => [
                  key, 
                  data[key] ? Object.keys(data[key]).length : 0
                ])
              )
            }
          }
        });

        logger.error('🎯 前端处理指南：缺失字段详情', {
          summary: `缺失 ${missingTests.length} 个测试，还需完成 ${missingTests.map(t => t.pageName).join('、')}`,
          missingPagesDetail: missingTests.map(test => ({
            页面名称: test.pageName,
            测试描述: test.description,
            字段名称: test.fieldName,
            前端路由建议: `/${test.testType}`,
            用户提示: `请完成${test.description}`
          })),
          completedPages: Object.entries(testTypeInfo)
            .filter(([_, info]) => info.present)
            .map(([key, info]) => ({
              页面名称: info.pageName,
              答题数量: data[key] ? Object.keys(data[key]).length : 0,
              状态: '✅ 已完成'
            })),
          actionRequired: {
            前端显示消息: `请完成剩余 ${missingTests.length} 个测试：${missingTests.map(t => t.description).join('、')}`,
            建议跳转页面: missingTests[0]?.pageName || '首页',
            错误级别: 'validation_error'
          }
        });

        return res.status(400).json({
          error: '数据不完整，请确保所有测试都已完成',
          code: 'INCOMPLETE_DATA',
          details: {
            message: `请完成剩余 ${missingTests.length} 个测试`,
            missingTests: missingTests.map(test => ({
              name: test.description,
              page: test.pageName,
              field: test.testType
            })),
            completedCount: 7 - missingTests.length,
            totalRequired: 7,
            nextStep: `请返回${missingTests[0]?.pageName || '相应页面'}完成测试`
          }
        });
      }

      const client = this.supabaseService.getClient();
      
      // 开始事务日志
      logger.info('🔄 开始答案提交事务', {
        transactionId,
        userInfo: {
          name: data.userInfo.name,
          questionsCount: {
            fiveQuestions: Object.keys(data.fiveQuestions || {}).length,
            mbti: Object.keys(data.mbti || {}).length,
            bigFive: Object.keys(data.bigFive || {}).length,
            disc: Object.keys(data.disc || {}).length,
            holland: Object.keys(data.holland || {}).length,
            values: Object.keys(data.values || {}).length
          }
        },
        inputParams: {
          originalRequest: {
            hasUserInfo: !!data.userInfo,
            userInfoFields: data.userInfo ? Object.keys(data.userInfo) : [],
            testTypesPresent: {
              fiveQuestions: !!data.fiveQuestions,
              mbti: !!data.mbti,
              bigFive: !!data.bigFive,
              disc: !!data.disc,
              holland: !!data.holland,
              values: !!data.values
            },
            totalQuestionAnswers: [
              data.fiveQuestions ? Object.keys(data.fiveQuestions).length : 0,
              data.mbti ? Object.keys(data.mbti).length : 0,
              data.bigFive ? Object.keys(data.bigFive).length : 0,
              data.disc ? Object.keys(data.disc).length : 0,
              data.holland ? Object.keys(data.holland).length : 0,
              data.values ? Object.keys(data.values).length : 0
            ].reduce((a, b) => a + b, 0)
          },
          validation: {
            userInfoValidation: {
              hasRequiredFields: !!(data.userInfo?.name && data.userInfo?.gender && data.userInfo?.age && 
                                   data.userInfo?.city && data.userInfo?.occupation && data.userInfo?.education),
              fieldTypes: data.userInfo ? {
                name: typeof data.userInfo.name,
                gender: typeof data.userInfo.gender,
                age: typeof data.userInfo.age,
                city: typeof data.userInfo.city,
                occupation: typeof data.userInfo.occupation,
                education: typeof data.userInfo.education,
                phone: typeof data.userInfo.phone
              } : {}
            }
          }
        }
      });

      // 1. 保存用户基础信息
      const userQueryId = databaseLogger.logQueryStart({
        table: 'user_survey',
        operation: 'INSERT',
        data: data.userInfo
      });

      const { data: userData, error: userError } = await client
        .from('user_survey')
        .insert({
          name: data.userInfo.name,
          gender: data.userInfo.gender,
          age: data.userInfo.age,
          city: data.userInfo.city,
          occupation: data.userInfo.occupation,
          education: data.userInfo.education,
          phone: data.userInfo.phone || null
        })
        .select()
        .single();

      if (userError || !userData) {
        databaseLogger.logQueryError(userQueryId, userError, Date.now(), {
          table: 'user_survey',
          operation: 'INSERT'
        });
        databaseLogger.logTransaction('rollback', transactionId);
        throw new Error(`保存用户信息失败: ${userError?.message}`);
      }

      databaseLogger.logQuerySuccess(userQueryId, userData, Date.now(), {
        table: 'user_survey',
        operation: 'INSERT'
      });

      const userId = userData.id;

      // 2. 获取所有模型信息
      const modelsQueryId = databaseLogger.logQueryStart({
        table: 'survey_model',
        operation: 'SELECT'
      });

      const { data: modelsData, error: modelsError } = await client
        .from('survey_model')
        .select('*');

      if (modelsError || !modelsData) {
        databaseLogger.logQueryError(modelsQueryId, modelsError, Date.now(), {
          table: 'survey_model',
          operation: 'SELECT'
        });
        databaseLogger.logTransaction('rollback', transactionId);
        throw new Error(`获取模型信息失败: ${modelsError?.message}`);
      }

      databaseLogger.logQuerySuccess(modelsQueryId, modelsData, Date.now(), {
        table: 'survey_model',
        operation: 'SELECT'
      });

      // 3. 获取所有题目信息
      const modelIds = modelsData.map((model: any) => model.id);
      const questionsQueryId = databaseLogger.logQueryStart({
        table: 'survey_question',
        operation: 'SELECT',
        filters: { model_id: modelIds }
      });

      const { data: questionsData, error: questionsError } = await client
        .from('survey_question')
        .select('*')
        .in('model_id', modelIds);

      if (questionsError || !questionsData) {
        databaseLogger.logQueryError(questionsQueryId, questionsError, Date.now(), {
          table: 'survey_question',
          operation: 'SELECT'
        });
        databaseLogger.logTransaction('rollback', transactionId);
        throw new Error(`获取题目信息失败: ${questionsError?.message}`);
      }

      databaseLogger.logQuerySuccess(questionsQueryId, questionsData, Date.now(), {
        table: 'survey_question',
        operation: 'SELECT'
      });

      // 4. 准备答案数据
      const answers: any[] = [];
      const answerStats = {
        fiveq: 0, mbti: 0, big5: 0, disc: 0, holland: 0, motivation: 0
      };

      // 处理各个测试类型的答案
      const testTypes = [
        { key: 'fiveQuestions', code: 'fiveq', data: data.fiveQuestions },
        { key: 'mbti', code: 'mbti', data: data.mbti },
        { key: 'bigFive', code: 'big5', data: data.bigFive },
        { key: 'disc', code: 'disc', data: data.disc },
        { key: 'holland', code: 'holland', data: data.holland },
        { key: 'values', code: 'motivation', data: data.values }
      ];

      for (const testType of testTypes) {
        const model = modelsData.find((m: any) => m.code === testType.code);
        if (model && testType.data) {
          Object.entries(testType.data).forEach(([questionCode, answer]) => {
            const question = questionsData.find((q: any) => 
              q.model_id === model.id && q.question_code === questionCode
            );
            
            if (question) {
              // 处理排序题的默认值
              if (question.type === 'sorting' && (!answer || !(answer as SortingAnswer).order)) {
                answer = { order: [1, 2, 3, 4, 5] };
              }
              
              answers.push({
                user_survey_id: userId,
                question_id: question.id,
                model_id: model.id,
                answer: answer
              });
              
              answerStats[testType.code as keyof typeof answerStats]++;
            }
          });
        }
      }

      logger.info('📊 答案数据准备完成', {
        transactionId,
        totalAnswers: answers.length,
        byType: answerStats
      });

      // 5. 批量保存答案
      const answersQueryId = databaseLogger.logQueryStart({
        table: 'user_survey_answer',
        operation: 'INSERT',
        data: { count: answers.length }
      });

      const { data: answersData, error: answersError } = await client
        .from('user_survey_answer')
        .insert(answers)
        .select();

      if (answersError || !answersData) {
        databaseLogger.logQueryError(answersQueryId, answersError, Date.now(), {
          table: 'user_survey_answer',
          operation: 'INSERT'
        });
        databaseLogger.logTransaction('rollback', transactionId);
        throw new Error(`保存答案失败: ${answersError?.message}`);
      }

      databaseLogger.logQuerySuccess(answersQueryId, answersData, Date.now(), {
        table: 'user_survey_answer',
        operation: 'INSERT'
      });

      // 6. 提交事务
      databaseLogger.logTransaction('commit', transactionId);
      const duration = Date.now() - startTime;

      logger.info('✅ 答案提交事务成功', {
        transactionId,
        userId,
        totalAnswers: answers.length,
        duration: `${duration}ms`
      });

      // 7. 🚀 自动触发分析（异步执行，不阻塞响应）
      const analysisRequest: AnalysisRequest = {
        userId,
        userInfo: data.userInfo,
        answers: {
          fiveQuestions: data.fiveQuestions,
          mbti: data.mbti,
          bigFive: data.bigFive,
          disc: data.disc,
          holland: data.holland,
          values: data.values
        }
      };

      // 异步执行AI增强分析，不等待结果
      this.aiAnalysisService.triggerAnalysisAfterSubmission(analysisRequest)
        .then((analysisResult: any) => {
          logger.info('🎯 AI增强分析已完成', {
            userId,
            analysisId: analysisResult.id,
            confidenceScore: analysisResult.confidence_score,
            processingTime: analysisResult.processing_time_ms,
            analysisMethod: analysisResult.analysis_method || 'AI-enhanced'
          });
        })
        .catch((error: any) => {
          logger.error('⚠️ AI增强分析失败（不影响答案提交）', {
            userId,
            error: {
              name: error instanceof Error ? error.name : 'Unknown',
              message: error instanceof Error ? error.message : String(error)
            }
          });
        });

      // 返回成功响应
      res.json({
        message: '测试结果保存成功，分析正在后台进行',
        surveyId: userId,
        stats: {
          totalAnswers: answers.length,
          answersByType: answerStats,
          duration: `${duration}ms`
        },
        analysis: {
          status: 'processing',
          message: '分析报告正在生成中，请稍后查看结果'
        }
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // 记录事务失败
      databaseLogger.logTransaction('rollback', transactionId);
      
      logger.error('❌ 答案提交事务失败', {
        transactionId,
        error: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        },
        duration: `${duration}ms`
      });

      res.status(500).json({
        error: error instanceof Error ? error.message : '处理测试提交失败',
        transactionId
      });
    }
  }
} 