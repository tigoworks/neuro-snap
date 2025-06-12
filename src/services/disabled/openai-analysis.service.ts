import { DatabaseLoggerService } from './database-logger.service';
import { MCPKnowledgeService, KnowledgeEntry } from './mcp-knowledge.service';
import axios from 'axios';

export interface AnalysisRequest {
  userId: string;
  userAnswers: any;
  analysisType?: 'comprehensive' | 'personality' | 'career' | 'custom';
  includeRecommendations?: boolean;
  language?: 'zh' | 'en';
}

export interface AnalysisResult {
  id: string;
  userId: string;
  analysisType: string;
  createdAt: Date;
  report: PersonalityReport;
  confidence: number;
  processingTime: number;
  knowledgeSourcesUsed: string[];
}

export interface PersonalityReport {
  summary: {
    title: string;
    overview: string;
    keyInsights: string[];
    strengthsAndWeaknesses: {
      strengths: string[];
      weaknesses: string[];
      improvementAreas: string[];
    };
  };
  personalityProfile: {
    mbtiType?: string;
    mbtiDescription: string;
    bigFiveScores: {
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      neuroticism: number;
    };
    discProfile: {
      dominance: number;
      influence: number;
      steadiness: number;
      conscientiousness: number;
      primaryStyle: string;
    };
    hollandCode: {
      realistic: number;
      investigative: number;
      artistic: number;
      social: number;
      enterprising: number;
      conventional: number;
      topThree: string[];
    };
  };
  careerGuidance: {
    idealCareers: Array<{
      title: string;
      match: number;
      description: string;
      requirements: string[];
      growthPotential: string;
    }>;
    careerDevelopmentPlan: {
      shortTerm: string[];
      mediumTerm: string[];
      longTerm: string[];
    };
    skillsToImprove: string[];
    industryRecommendations: string[];
  };
  workStyle: {
    preferredEnvironment: string;
    workingStyle: string;
    communicationStyle: string;
    leadershipStyle: string;
    teamRole: string;
    motivationFactors: string[];
  };
  recommendations: {
    personalDevelopment: string[];
    learningResources: string[];
    actionItems: string[];
    nextSteps: string[];
  };
  visualizationData: {
    personalityChart: any;
    careerFitChart: any;
    skillsRadarChart: any;
    developmentPathway: any;
  };
}

export class OpenAIAnalysisService {
  private logger: DatabaseLoggerService;
  private knowledgeService: MCPKnowledgeService;
  private openaiApiKey: string;
  private openaiBaseUrl: string;

  constructor() {
    this.logger = DatabaseLoggerService.getInstance();
    this.knowledgeService = new MCPKnowledgeService();
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.openaiBaseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    
    if (!this.openaiApiKey) {
      console.warn('⚠️  OpenAI API密钥未配置，AI分析功能将不可用');
    }
  }

  /**
   * 执行综合分析
   */
  async performAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
    const startTime = Date.now();
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const queryId = await this.logger.logQuery({
      operation: 'AI_ANALYSIS',
      table: 'ai_analysis',
      queryId: analysisId
    });

    try {
      console.log(`🤖 开始AI分析: ${request.userId} (${request.analysisType || 'comprehensive'})`);

      // 1. 收集相关知识
      const relevantKnowledge = await this.knowledgeService.getRelevantKnowledge(request.userAnswers);
      console.log(`📚 收集到 ${relevantKnowledge.length} 条相关知识`);

      // 2. 构建分析提示词
      const analysisPrompt = this.buildAnalysisPrompt(request, relevantKnowledge);

      // 3. 调用OpenAI API
      const openaiResponse = await this.callOpenAI(analysisPrompt, request.language || 'zh');

      // 4. 解析和结构化结果
      const report = this.parseAnalysisResult(openaiResponse);

      // 5. 生成可视化数据
      const visualizationData = this.generateVisualizationData(request.userAnswers, report);
      report.visualizationData = visualizationData;

      const processingTime = Date.now() - startTime;
      
      const result: AnalysisResult = {
        id: analysisId,
        userId: request.userId,
        analysisType: request.analysisType || 'comprehensive',
        createdAt: new Date(),
        report,
        confidence: this.calculateConfidence(request.userAnswers, relevantKnowledge),
        processingTime,
        knowledgeSourcesUsed: relevantKnowledge.map(k => k.id)
      };

      await this.logger.logQueryResult(queryId, {
        success: true,
        resultCount: 1,
        resultSize: JSON.stringify(result).length,
        duration: processingTime
      });

      console.log(`✅ AI分析完成: ${analysisId} (${processingTime}ms)`);
      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      await this.logger.logQueryResult(queryId, {
        success: false,
        error: error.message,
        duration: processingTime
      });
      
      console.error('❌ AI分析失败:', error);
      throw new Error(`AI分析失败: ${error.message}`);
    }
  }

  /**
   * 构建分析提示词
   */
  private buildAnalysisPrompt(request: AnalysisRequest, knowledge: KnowledgeEntry[]): string {
    const userInfo = request.userAnswers.userInfo || {};
    const knowledgeContext = knowledge.map(k => `${k.title}: ${k.content.substring(0, 500)}...`).join('\n\n');

    return `
你是一位资深的心理学专家和职业规划顾问，请基于以下信息对用户进行全面的心理测评分析：

## 用户基本信息
- 姓名: ${userInfo.name || '未提供'}
- 年龄: ${userInfo.age || '未提供'}
- 性别: ${userInfo.gender || '未提供'}  
- 城市: ${userInfo.city || '未提供'}
- 职业: ${userInfo.occupation || '未提供'}
- 学历: ${userInfo.education || '未提供'}

## 测评结果数据
### 五问法测试
${JSON.stringify(request.userAnswers.fiveQuestions || {}, null, 2)}

### MBTI人格测试
${JSON.stringify(request.userAnswers.mbti || {}, null, 2)}

### 大五人格测试
${JSON.stringify(request.userAnswers.bigFive || {}, null, 2)}

### DISC行为测试
${JSON.stringify(request.userAnswers.disc || {}, null, 2)}

### 霍兰德职业兴趣测试
${JSON.stringify(request.userAnswers.holland || {}, null, 2)}

### 价值观测试
${JSON.stringify(request.userAnswers.values || {}, null, 2)}

## 专业知识参考
${knowledgeContext}

## 分析要求
请提供一份详细的心理测评分析报告，包含以下内容（请以JSON格式返回）：

1. **综合概述** (summary)
   - 整体人格特征总结
   - 关键洞察和发现
   - 主要优势和劣势
   - 改进建议

2. **人格画像** (personalityProfile)
   - MBTI类型和详细描述
   - 大五人格各维度得分(0-100)
   - DISC行为风格分析
   - 霍兰德兴趣代码

3. **职业指导** (careerGuidance)
   - 推荐职业（至少5个，包含匹配度）
   - 职业发展规划（短中长期）
   - 需要提升的技能
   - 适合的行业领域

4. **工作风格** (workStyle)
   - 偏好的工作环境
   - 工作方式特点
   - 沟通风格
   - 领导风格
   - 团队角色
   - 激励因素

5. **发展建议** (recommendations)
   - 个人发展建议
   - 学习资源推荐
   - 具体行动项
   - 下一步计划

请确保分析：
- 基于科学的心理学理论
- 结合实际的职业发展建议
- 具有可操作性和实用性
- 语言专业但易于理解
- 积极正面，给予用户信心

返回格式：纯JSON，不要包含任何markdown标记或额外文本。
`;
  }

  /**
   * 调用OpenAI API
   */
  private async callOpenAI(prompt: string, language: string = 'zh'): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API密钥未配置');
    }

    const response = await axios.post(
      `${this.openaiBaseUrl}/chat/completions`,
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: language === 'zh' 
              ? '你是一位专业的心理学专家和职业规划顾问，请提供专业、准确、有用的分析。'
              : 'You are a professional psychologist and career counselor. Please provide professional, accurate, and helpful analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      },
      {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    if (response.data.error) {
      throw new Error(`OpenAI API错误: ${response.data.error.message}`);
    }

    return response.data.choices[0].message.content;
  }

  /**
   * 解析分析结果
   */
  private parseAnalysisResult(openaiResponse: string): PersonalityReport {
    try {
      // 清理可能的markdown格式
      const cleanedResponse = openaiResponse.replace(/```json\n?|\n?```/g, '').trim();
      const parsedResult = JSON.parse(cleanedResponse);
      
      // 验证和填充默认值
      return {
        summary: {
          title: parsedResult.summary?.title || '个人特质分析报告',
          overview: parsedResult.summary?.overview || '暂无概述',
          keyInsights: parsedResult.summary?.keyInsights || [],
          strengthsAndWeaknesses: {
            strengths: parsedResult.summary?.strengthsAndWeaknesses?.strengths || [],
            weaknesses: parsedResult.summary?.strengthsAndWeaknesses?.weaknesses || [],
            improvementAreas: parsedResult.summary?.strengthsAndWeaknesses?.improvementAreas || []
          }
        },
        personalityProfile: {
          mbtiType: parsedResult.personalityProfile?.mbtiType,
          mbtiDescription: parsedResult.personalityProfile?.mbtiDescription || '',
          bigFiveScores: {
            openness: parsedResult.personalityProfile?.bigFiveScores?.openness || 50,
            conscientiousness: parsedResult.personalityProfile?.bigFiveScores?.conscientiousness || 50,
            extraversion: parsedResult.personalityProfile?.bigFiveScores?.extraversion || 50,
            agreeableness: parsedResult.personalityProfile?.bigFiveScores?.agreeableness || 50,
            neuroticism: parsedResult.personalityProfile?.bigFiveScores?.neuroticism || 50
          },
          discProfile: {
            dominance: parsedResult.personalityProfile?.discProfile?.dominance || 25,
            influence: parsedResult.personalityProfile?.discProfile?.influence || 25,
            steadiness: parsedResult.personalityProfile?.discProfile?.steadiness || 25,
            conscientiousness: parsedResult.personalityProfile?.discProfile?.conscientiousness || 25,
            primaryStyle: parsedResult.personalityProfile?.discProfile?.primaryStyle || 'Mixed'
          },
          hollandCode: {
            realistic: parsedResult.personalityProfile?.hollandCode?.realistic || 15,
            investigative: parsedResult.personalityProfile?.hollandCode?.investigative || 15,
            artistic: parsedResult.personalityProfile?.hollandCode?.artistic || 15,
            social: parsedResult.personalityProfile?.hollandCode?.social || 15,
            enterprising: parsedResult.personalityProfile?.hollandCode?.enterprising || 15,
            conventional: parsedResult.personalityProfile?.hollandCode?.conventional || 15,
            topThree: parsedResult.personalityProfile?.hollandCode?.topThree || []
          }
        },
        careerGuidance: {
          idealCareers: parsedResult.careerGuidance?.idealCareers || [],
          careerDevelopmentPlan: {
            shortTerm: parsedResult.careerGuidance?.careerDevelopmentPlan?.shortTerm || [],
            mediumTerm: parsedResult.careerGuidance?.careerDevelopmentPlan?.mediumTerm || [],
            longTerm: parsedResult.careerGuidance?.careerDevelopmentPlan?.longTerm || []
          },
          skillsToImprove: parsedResult.careerGuidance?.skillsToImprove || [],
          industryRecommendations: parsedResult.careerGuidance?.industryRecommendations || []
        },
        workStyle: {
          preferredEnvironment: parsedResult.workStyle?.preferredEnvironment || '',
          workingStyle: parsedResult.workStyle?.workingStyle || '',
          communicationStyle: parsedResult.workStyle?.communicationStyle || '',
          leadershipStyle: parsedResult.workStyle?.leadershipStyle || '',
          teamRole: parsedResult.workStyle?.teamRole || '',
          motivationFactors: parsedResult.workStyle?.motivationFactors || []
        },
        recommendations: {
          personalDevelopment: parsedResult.recommendations?.personalDevelopment || [],
          learningResources: parsedResult.recommendations?.learningResources || [],
          actionItems: parsedResult.recommendations?.actionItems || [],
          nextSteps: parsedResult.recommendations?.nextSteps || []
        },
        visualizationData: {
          personalityChart: null,
          careerFitChart: null,
          skillsRadarChart: null,
          developmentPathway: null
        }
      };
    } catch (error) {
      console.error('解析AI响应失败:', error);
      throw new Error(`解析AI分析结果失败: ${error.message}`);
    }
  }

  /**
   * 生成可视化数据
   */
  private generateVisualizationData(userAnswers: any, report: PersonalityReport): any {
    return {
      personalityChart: {
        type: 'radar',
        data: {
          labels: ['开放性', '责任心', '外向性', '宜人性', '神经质'],
          datasets: [{
            label: '大五人格得分',
            data: [
              report.personalityProfile.bigFiveScores.openness,
              report.personalityProfile.bigFiveScores.conscientiousness,
              report.personalityProfile.bigFiveScores.extraversion,
              report.personalityProfile.bigFiveScores.agreeableness,
              report.personalityProfile.bigFiveScores.neuroticism
            ],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2
          }]
        }
      },
      careerFitChart: {
        type: 'bar',
        data: {
          labels: report.careerGuidance.idealCareers.slice(0, 6).map(c => c.title),
          datasets: [{
            label: '职业匹配度',
            data: report.careerGuidance.idealCareers.slice(0, 6).map(c => c.match),
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 205, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(153, 102, 255, 0.8)',
              'rgba(255, 159, 64, 0.8)'
            ]
          }]
        }
      },
      skillsRadarChart: {
        type: 'radar',
        data: {
          labels: ['支配性', '影响力', '稳定性', '谨慎性'],
          datasets: [{
            label: 'DISC行为风格',
            data: [
              report.personalityProfile.discProfile.dominance,
              report.personalityProfile.discProfile.influence,
              report.personalityProfile.discProfile.steadiness,
              report.personalityProfile.discProfile.conscientiousness
            ],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2
          }]
        }
      },
      developmentPathway: {
        type: 'timeline',
        data: {
          shortTerm: report.careerGuidance.careerDevelopmentPlan.shortTerm,
          mediumTerm: report.careerGuidance.careerDevelopmentPlan.mediumTerm,
          longTerm: report.careerGuidance.careerDevelopmentPlan.longTerm
        }
      },
      hollandChart: {
        type: 'polarArea',
        data: {
          labels: ['现实型', '研究型', '艺术型', '社会型', '企业型', '常规型'],
          datasets: [{
            label: '霍兰德兴趣类型',
            data: [
              report.personalityProfile.hollandCode.realistic,
              report.personalityProfile.hollandCode.investigative,
              report.personalityProfile.hollandCode.artistic,
              report.personalityProfile.hollandCode.social,
              report.personalityProfile.hollandCode.enterprising,
              report.personalityProfile.hollandCode.conventional
            ],
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 205, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)',
              'rgba(255, 159, 64, 0.7)'
            ]
          }]
        }
      }
    };
  }

  /**
   * 计算分析可信度
   */
  private calculateConfidence(userAnswers: any, knowledge: KnowledgeEntry[]): number {
    let confidence = 0.5; // 基础可信度50%

    // 根据测试完整性调整
    const testTypes = ['userInfo', 'fiveQuestions', 'mbti', 'bigFive', 'disc', 'holland', 'values'];
    const completedTests = testTypes.filter(type => userAnswers[type] && Object.keys(userAnswers[type]).length > 0);
    confidence += (completedTests.length / testTypes.length) * 0.3; // 最多增加30%

    // 根据知识库匹配度调整
    confidence += Math.min(knowledge.length / 10, 0.2); // 最多增加20%

    return Math.min(confidence, 1.0); // 最高100%
  }

  /**
   * 获取分析历史
   */
  async getAnalysisHistory(userId: string): Promise<AnalysisResult[]> {
    // 这里应该从数据库获取历史记录
    // 暂时返回空数组
    return [];
  }

  /**
   * 删除分析记录
   */
  async deleteAnalysis(analysisId: string): Promise<boolean> {
    // 这里应该从数据库删除记录
    return true;
  }
} 