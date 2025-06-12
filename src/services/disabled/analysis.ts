import { ServiceFactory } from './factory';
import { AnalysisResult } from '../types';
import logger from '../utils/logger';
import * as db from './database';

export class AnalysisService {
  async performAnalysis(userId: string, modelType: string): Promise<AnalysisResult> {
    logger.info(`Starting analysis for user ${userId} with model ${modelType}`);

    try {
      // 1. 获取用户调查数据
      const survey = await db.getSurveyByUserId(userId);
      if (!survey) {
        throw new Error('User survey not found');
      }

      // 2. 获取用户答案
      const rawAnswers = await db.getRawAnswersBySurveyId(survey.id);
      if (!rawAnswers || rawAnswers.length === 0) {
        throw new Error('No answers found for this survey');
      }

      // 3. 获取知识库数据
      const knowledgeBase = await db.getKnowledgeBaseByModel(modelType);
      if (!knowledgeBase || knowledgeBase.length === 0) {
        throw new Error('Knowledge base not found for this model');
      }

      // 4. 创建AI服务
      const aiService = ServiceFactory.createAIService({
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 1000,
      });

      // 5. 构建分析提示
      const prompt = this.buildAnalysisPrompt(rawAnswers, knowledgeBase, modelType);

      // 6. 执行AI分析
      const analysisText = await aiService.generateResponse(prompt);

      // 7. 保存分析结果
      const result = await db.saveAnalysisResult({
        user_id: userId,
        model_type: modelType,
        analysis_text: analysisText,
        status: 'completed',
        metadata: {
          prompt_length: prompt.length,
          response_length: analysisText.length,
          model_used: 'gpt-3.5-turbo',
        },
      });

      logger.info(`Analysis completed for user ${userId}`);
      return result;

    } catch (error) {
      logger.error(`Analysis failed for user ${userId}:`, error);
      // 更新状态为失败
      const survey = await db.getSurveyByUserId(userId);
      if (survey) {
        await db.updateSurveyStatus(survey.id, 'failed');
      }
      throw error;
    }
  }

  private buildAnalysisPrompt(answers: any[], knowledgeBase: any[], modelType: string): string {
    // 构建分析提示的逻辑
    const answersText = answers.map(a => `${a.question_id}: ${JSON.stringify(a.answer)}`).join('\n');
    const knowledgeText = knowledgeBase.map(k => k.content).join('\n');

    return `
      分析以下${modelType}测试的答案：
      
      答案：
      ${answersText}
      
      知识库：
      ${knowledgeText}
      
      请根据答案和知识库给出详细的分析报告。
    `;
  }

  async getAnalysisStatus(userId: string): Promise<{ status: string; result?: AnalysisResult }> {
    try {
      const result = await db.getAnalysisResultByUserId(userId);
      return { status: 'completed', result };
    } catch (error) {
      return { status: 'not_found' };
    }
  }
} 