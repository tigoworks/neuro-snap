import crypto from 'crypto';
import logger from '../utils/logger';
import { KnowledgeManagerService } from './knowledge-manager.service';
import { SupabaseService } from './supabase.service';
import { databaseLogger } from './database-logger.service';

export interface AnalysisRequest {
  userId: string;
  userInfo: any;
  answers: {
    fiveQuestions?: any;
    mbti?: any;
    bigFive?: any;
    disc?: any;
    holland?: any;
    values?: any;
  };
}

export interface AnalysisResult {
  id: string;
  user_id: string;
  analysis_type: string;
  summary: string;
  detailed_analysis: any;
  recommendations: string[];
  confidence_score: number;
  knowledge_sources: string[];
  created_at: string;
  processing_time_ms: number;
}

export class AutoAnalysisService {
  private knowledgeService: KnowledgeManagerService;
  private supabaseService: SupabaseService;

  constructor() {
    this.knowledgeService = KnowledgeManagerService.getInstance();
    this.supabaseService = SupabaseService.getInstance();
  }

  /**
   * 答案提交后自动触发分析
   */
  async triggerAnalysisAfterSubmission(request: AnalysisRequest): Promise<AnalysisResult> {
    const startTime = Date.now();
    const analysisId = this.generateAnalysisId();
    
    logger.info('🧠 开始自动分析', {
      analysisId,
      userId: request.userId,
      userName: request.userInfo?.name,
      testTypes: Object.keys(request.answers).filter(key => request.answers[key as keyof typeof request.answers])
    });

    try {
      // 1. 获取相关知识库内容
      const knowledgeBase = await this.getRelevantKnowledge(request.answers);
      
      // 2. 执行综合分析
      const analysisResult = await this.performComprehensiveAnalysis(request, knowledgeBase);
      
      // 3. 保存分析结果到数据库
      const savedResult = await this.saveAnalysisResult(analysisId, request.userId, analysisResult, startTime);
      
      logger.info('✅ 自动分析完成', {
        analysisId,
        userId: request.userId,
        processingTime: `${Date.now() - startTime}ms`,
        confidenceScore: savedResult.confidence_score,
        knowledgeSourcesUsed: savedResult.knowledge_sources.length
      });

      return savedResult;

    } catch (error) {
      logger.error('❌ 自动分析失败', {
        analysisId,
        userId: request.userId,
        error: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error)
        },
        processingTime: `${Date.now() - startTime}ms`
      });
      throw error;
    }
  }

  /**
   * 获取相关知识库内容
   */
  private async getRelevantKnowledge(answers: any): Promise<any[]> {
    const queryId = databaseLogger.logQueryStart({
      table: 'knowledge_base',
      operation: 'SELECT',
      filters: { model_tag: 'multiple' }
    });

    try {
      const knowledgeItems = [];
      
      // 根据测试类型获取相关知识
      const testTypes = Object.keys(answers).filter(key => answers[key]);
      
      for (const testType of testTypes) {
        const modelTag = this.mapTestTypeToModelTag(testType);
        const items = await this.knowledgeService.getKnowledgeByModel(modelTag);
        knowledgeItems.push(...items);
      }

      // 获取通用企业文化知识
      const cultureItems = await this.knowledgeService.searchKnowledge('企业文化 价值观', '10');
      knowledgeItems.push(...cultureItems);

      databaseLogger.logQuerySuccess(queryId, knowledgeItems, Date.now(), {
        table: 'knowledge_base',
        operation: 'SELECT'
      });

      return knowledgeItems;

    } catch (error) {
      databaseLogger.logQueryError(queryId, error, Date.now(), {
        table: 'knowledge_base',
        operation: 'SELECT'
      });
      throw error;
    }
  }

  /**
   * 执行综合分析
   */
  private async performComprehensiveAnalysis(request: AnalysisRequest, knowledgeBase: any[]): Promise<any> {
    const { userInfo, answers } = request;
    
    // 构建分析报告
    const analysis = {
      personalProfile: this.analyzePersonalProfile(userInfo),
      testResults: this.analyzeTestResults(answers),
      careerRecommendations: this.generateCareerRecommendations(answers, knowledgeBase),
      developmentSuggestions: this.generateDevelopmentSuggestions(answers, knowledgeBase),
      culturalFit: this.analyzeCulturalFit(answers, knowledgeBase),
      strengthsAndWeaknesses: this.analyzeStrengthsAndWeaknesses(answers)
    };

    // 生成摘要
    const summary = this.generateAnalysisSummary(analysis);
    
    // 计算置信度
    const confidenceScore = this.calculateConfidenceScore(answers, knowledgeBase);

    // 提取推荐建议
    const recommendations = this.extractRecommendations(analysis);

    return {
      summary,
      detailed_analysis: analysis,
      recommendations,
      confidence_score: confidenceScore,
      knowledge_sources: knowledgeBase.map(item => item.title || item.id)
    };
  }

  /**
   * 分析个人档案
   */
  private analyzePersonalProfile(userInfo: any): any {
    return {
      basicInfo: {
        name: userInfo.name,
        age: userInfo.age,
        gender: userInfo.gender,
        city: userInfo.city,
        occupation: userInfo.occupation,
        education: userInfo.education
      },
      demographics: {
        ageGroup: this.categorizeAge(userInfo.age),
        educationLevel: this.categorizeEducation(userInfo.education),
        careerStage: this.determineCareerStage(userInfo.age, userInfo.occupation)
      }
    };
  }

  /**
   * 分析测试结果
   */
  private analyzeTestResults(answers: any): any {
    const results: any = {};

    if (answers.fiveQuestions) {
      results.careerDevelopment = this.analyzeFiveQuestions(answers.fiveQuestions);
    }

    if (answers.mbti) {
      results.personality = this.analyzeMBTI(answers.mbti);
    }

    if (answers.bigFive) {
      results.personalityTraits = this.analyzeBigFive(answers.bigFive);
    }

    if (answers.disc) {
      results.behaviorStyle = this.analyzeDISC(answers.disc);
    }

    if (answers.holland) {
      results.careerInterests = this.analyzeHolland(answers.holland);
    }

    if (answers.values) {
      results.workValues = this.analyzeValues(answers.values);
    }

    return results;
  }

  /**
   * 生成职业推荐
   */
  private generateCareerRecommendations(answers: any, knowledgeBase: any[]): string[] {
    const recommendations = [];
    
    // 基于测试结果生成推荐
    if (answers.holland) {
      recommendations.push('基于霍兰德测试结果，建议考虑相关职业领域');
    }
    
    if (answers.mbti) {
      recommendations.push('根据MBTI人格类型，推荐适合的工作环境和角色');
    }

    // 基于知识库生成更具体的推荐
    const cultureItems = knowledgeBase.filter(item => 
      item.title?.includes('价值观') || item.content?.includes('职业发展')
    );
    
    if (cultureItems.length > 0) {
      recommendations.push('结合企业文化价值观，建议关注个人发展与企业目标的匹配');
    }

    return recommendations;
  }

  /**
   * 生成发展建议
   */
  private generateDevelopmentSuggestions(answers: any, knowledgeBase: any[]): string[] {
    const suggestions = [];
    
    // 基于大五人格特质
    if (answers.bigFive) {
      suggestions.push('基于人格特质分析，建议重点发展相关能力');
    }

    // 基于DISC行为风格
    if (answers.disc) {
      suggestions.push('根据行为风格，建议优化沟通和协作方式');
    }

    // 基于企业文化知识
    const cultureItems = knowledgeBase.filter(item => 
      item.title?.includes('文化') || item.content?.includes('发展')
    );
    
    if (cultureItems.length > 0) {
      suggestions.push('结合企业文化要求，建议加强相关素质培养');
    }

    return suggestions;
  }

  /**
   * 分析文化匹配度
   */
  private analyzeCulturalFit(answers: any, knowledgeBase: any[]): any {
    const cultureItems = knowledgeBase.filter(item => 
      item.category === 'company_values' || 
      item.title?.includes('价值观') ||
      item.title?.includes('文化')
    );

    return {
      matchingValues: this.findMatchingValues(answers, cultureItems),
      developmentAreas: this.identifyDevelopmentAreas(answers, cultureItems),
      overallFitScore: this.calculateCulturalFitScore(answers, cultureItems)
    };
  }

  /**
   * 分析优势和劣势
   */
  private analyzeStrengthsAndWeaknesses(answers: any): any {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const developmentAreas: string[] = [];

    // 基于各项测试结果分析
    if (answers.bigFive) {
      // 分析大五人格的强项和弱项
      strengths.push('基于人格特质的天然优势');
      developmentAreas.push('可以进一步发展的人格维度');
    }

    if (answers.disc) {
      // 分析DISC的行为优势
      strengths.push('在团队协作中的行为优势');
      developmentAreas.push('可以改善的沟通风格');
    }

    return {
      strengths,
      weaknesses,
      developmentAreas,
      actionPlan: this.generateActionPlan(strengths, developmentAreas)
    };
  }

  /**
   * 生成分析摘要
   */
  private generateAnalysisSummary(analysis: any): string {
    const parts = [];
    
    if (analysis.personalProfile) {
      parts.push(`${analysis.personalProfile.basicInfo.name}的综合测评分析报告`);
    }
    
    if (analysis.testResults) {
      const testCount = Object.keys(analysis.testResults).length;
      parts.push(`完成了${testCount}项专业测评`);
    }
    
    if (analysis.careerRecommendations) {
      parts.push(`提供了${analysis.careerRecommendations.length}项职业发展建议`);
    }

    return parts.join('，') + '。';
  }

  /**
   * 计算置信度分数
   */
  private calculateConfidenceScore(answers: any, knowledgeBase: any[]): number {
    let score = 0.5; // 基础分数
    
    // 根据完成的测试数量调整
    const testCount = Object.keys(answers).filter(key => answers[key]).length;
    score += testCount * 0.1;
    
    // 根据知识库匹配度调整
    if (knowledgeBase.length > 10) {
      score += 0.2;
    }
    
    // 确保分数在0-1之间
    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * 提取推荐建议
   */
  private extractRecommendations(analysis: any): string[] {
    const recommendations = [];
    
    if (analysis.careerRecommendations) {
      recommendations.push(...analysis.careerRecommendations);
    }
    
    if (analysis.developmentSuggestions) {
      recommendations.push(...analysis.developmentSuggestions);
    }
    
    if (analysis.strengthsAndWeaknesses?.actionPlan) {
      recommendations.push(...analysis.strengthsAndWeaknesses.actionPlan);
    }
    
    return recommendations;
  }

  /**
   * 保存分析结果到数据库
   */
  private async saveAnalysisResult(
    analysisId: string, 
    userId: string, 
    analysisResult: any, 
    startTime: number
  ): Promise<AnalysisResult> {
    const queryId = databaseLogger.logQueryStart({
      table: 'analysis_results',
      operation: 'INSERT',
      data: { user_id: userId, analysis_type: 'comprehensive' }
    });

    try {
      const client = this.supabaseService.getClient();
      const processingTime = Date.now() - startTime;
      
      const { data, error } = await client
        .from('analysis_results')
        .insert({
          id: analysisId,
          user_id: userId,
          model_code: 'auto-analysis-v1',
          result_summary: analysisResult.summary,
          result_json: {
            detailed_analysis: analysisResult.detailed_analysis,
            recommendations: analysisResult.recommendations,
            confidence_score: analysisResult.confidence_score,
            knowledge_sources: analysisResult.knowledge_sources,
            processing_time_ms: processingTime,
            analysis_type: 'comprehensive'
          }
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      databaseLogger.logQuerySuccess(queryId, data, Date.now(), {
        table: 'analysis_results',
        operation: 'INSERT'
      });

      return {
        id: data.id,
        user_id: data.user_id,
        analysis_type: 'comprehensive',
        summary: data.result_summary,
        detailed_analysis: data.result_json.detailed_analysis,
        recommendations: data.result_json.recommendations,
        confidence_score: data.result_json.confidence_score,
        knowledge_sources: data.result_json.knowledge_sources,
        created_at: data.completed_at,
        processing_time_ms: processingTime
      };

    } catch (error) {
      databaseLogger.logQueryError(queryId, error, Date.now(), {
        table: 'analysis_results',
        operation: 'INSERT'
      });
      throw error;
    }
  }

  // 辅助方法
  private generateAnalysisId(): string {
    return crypto.randomUUID();
  }

  private mapTestTypeToModelTag(testType: string): string {
    const mapping: { [key: string]: string } = {
      'fiveQuestions': 'career_development',
      'mbti': 'personality',
      'bigFive': 'personality_traits',
      'disc': 'behavior_style',
      'holland': 'career_interests',
      'values': 'work_values'
    };
    return mapping[testType] || 'general';
  }

  private categorizeAge(age: number): string {
    if (age < 25) return '年轻群体';
    if (age < 35) return '青年群体';
    if (age < 45) return '中年群体';
    return '成熟群体';
  }

  private categorizeEducation(education: string): string {
    if (education?.includes('博士')) return '博士学历';
    if (education?.includes('硕士')) return '硕士学历';
    if (education?.includes('本科')) return '本科学历';
    return '其他学历';
  }

  private determineCareerStage(age: number, occupation: string): string {
    if (age < 25) return '职业起步期';
    if (age < 35) return '职业发展期';
    if (age < 45) return '职业成熟期';
    return '职业稳定期';
  }

  // 具体测试分析方法（简化版本）
  private analyzeFiveQuestions(answers: any): any {
    return { type: 'career_development', summary: '职业发展五问法分析结果' };
  }

  private analyzeMBTI(answers: any): any {
    return { type: 'personality', summary: 'MBTI人格类型分析结果' };
  }

  private analyzeBigFive(answers: any): any {
    return { type: 'personality_traits', summary: '大五人格特质分析结果' };
  }

  private analyzeDISC(answers: any): any {
    return { type: 'behavior_style', summary: 'DISC行为风格分析结果' };
  }

  private analyzeHolland(answers: any): any {
    return { type: 'career_interests', summary: '霍兰德职业兴趣分析结果' };
  }

  private analyzeValues(answers: any): any {
    return { type: 'work_values', summary: '工作价值观分析结果' };
  }

  private findMatchingValues(answers: any, cultureItems: any[]): string[] {
    return ['匹配的企业价值观1', '匹配的企业价值观2'];
  }

  private identifyDevelopmentAreas(answers: any, cultureItems: any[]): string[] {
    return ['需要发展的领域1', '需要发展的领域2'];
  }

  private calculateCulturalFitScore(answers: any, cultureItems: any[]): number {
    return 0.8; // 示例分数
  }

  private generateActionPlan(strengths: string[], developmentAreas: string[]): string[] {
    return [
      '基于优势制定发展计划',
      '针对发展领域制定改进措施',
      '设定阶段性目标和里程碑'
    ];
  }
} 