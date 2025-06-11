import { Request, Response } from 'express';
import { SupabaseService } from '../services/supabase.service';
import logger from '../utils/logger';

interface UserInfo {
  name: string;
  gender: 'male' | 'female';
  age: number;
  city: string;
  occupation: string;
  education: string;
  phone: string;
}

interface TestSubmissionData {
  userInfo: UserInfo;
  fiveQuestions?: Record<string, any>;
  mbti?: Record<string, any>;
  bigFive?: Record<string, any>;
  disc?: Record<string, any>;
  holland?: Record<string, any>;
  values?: Record<string, any>;
}

export class TestController {
  private supabaseService: SupabaseService;

  constructor() {
    this.supabaseService = SupabaseService.getInstance();
  }

  // 提交测试结果接口 - POST /api/submit-test
  async submitTest(req: Request, res: Response) {
    try {
      const data: TestSubmissionData = req.body;

      // 验证数据完整性
      if (!data.userInfo || !data.userInfo.name || !data.userInfo.gender) {
        return res.status(400).json({
          error: '数据不完整',
        });
      }

      // 1. 保存用户信息
      let userId: string;
      try {
        const { data: userData, error: userError } = await this.supabaseService.getClient()
          .from('user_survey')
          .insert({
            name: data.userInfo.name,
            gender: data.userInfo.gender,
            age: data.userInfo.age,
            city: data.userInfo.city,
            occupation: data.userInfo.occupation,
            education: data.userInfo.education,
            phone: data.userInfo.phone,
          })
          .select()
          .single();

        if (userError) throw userError;
        userId = userData.id;
        logger.info(`User info saved with ID: ${userId}`);
      } catch (error) {
        logger.error('Error saving user info:', error);
        return res.status(500).json({
          error: '保存用户信息失败',
        });
      }

      // 2. 获取所有模型信息用于后续答案保存
      let models: Record<string, any> = {};
      try {
        const { data: modelsData, error: modelsError } = await this.supabaseService.getClient()
          .from('survey_model')
          .select('*');

        if (modelsError) throw modelsError;
        
        modelsData?.forEach((model: any) => {
          models[model.code] = model;
        });
      } catch (error) {
        logger.error('Error getting models:', error);
        return res.status(500).json({
          error: '获取模型信息失败',
        });
      }

      // 3. 获取所有题目信息
      let questions: Record<string, any> = {};
      try {
        const { data: questionsData, error: questionsError } = await this.supabaseService.getClient()
          .from('survey_question')
          .select('*');

        if (questionsError) throw questionsError;
        
        questionsData?.forEach((question: any) => {
          questions[question.question_code] = question;
        });
      } catch (error) {
        logger.error('Error getting questions:', error);
        return res.status(500).json({
          error: '获取题目信息失败',
        });
      }

      // 4. 保存各个测试的答案
      const answerSets = [
        { key: 'fiveQuestions', modelCode: 'fiveq', data: data.fiveQuestions },
        { key: 'mbti', modelCode: 'mbti', data: data.mbti },
        { key: 'bigFive', modelCode: 'big5', data: data.bigFive },
        { key: 'disc', modelCode: 'disc', data: data.disc },
        { key: 'holland', modelCode: 'holland', data: data.holland },
        { key: 'values', modelCode: 'motivation', data: data.values },
      ];

      try {
        for (const answerSet of answerSets) {
          if (answerSet.data && models[answerSet.modelCode]) {
            const model = models[answerSet.modelCode];
            
            // 遍历每个答案
            for (const [questionCode, answer] of Object.entries(answerSet.data)) {
              const question = questions[questionCode];
              if (question) {
                await this.supabaseService.getClient()
                  .from('user_survey_answer')
                  .insert({
                    user_survey_id: userId,
                    question_id: question.id,
                    model_id: model.id,
                    answer: answer, // JSONB字段，支持各种格式的答案
                  });
              }
            }
            
            logger.info(`Saved answers for ${answerSet.modelCode}: ${Object.keys(answerSet.data).length} questions`);
          }
        }
      } catch (error) {
        logger.error('Error saving answers:', error);
        return res.status(500).json({
          error: '保存答案失败',
        });
      }

      // 5. 返回成功响应
      res.json({
        message: '测试结果保存成功',
      });

      logger.info(`Test submission completed successfully for user: ${userId}`);
    } catch (error) {
      logger.error('Error in test submission:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : '处理测试提交失败',
      });
    }
  }
} 