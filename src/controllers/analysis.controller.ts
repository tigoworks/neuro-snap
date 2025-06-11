import { Request, Response } from 'express';
import { ServiceFactory } from '../services/factory';
import { AnalysisRequest } from '../types';

export class AnalysisController {
  // 分析用户回答
  async analyzeAnswers(req: Request, res: Response) {
    try {
      const { modelType, answers, knowledgeBase, options } = req.body;

      // 获取 AI 服务
      const aiService = ServiceFactory.createAIService({
        provider: 'openai',
        api_key: process.env.OPENAI_API_KEY || '',
        model: 'gpt-4',
        temperature: options?.temperature || 0.7,
        max_tokens: options?.max_tokens || 2000,
      });

      // 构建分析请求
      const request: AnalysisRequest = {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的性格分析专家。请根据用户的回答和知识库内容进行分析。
            知识库内容：${JSON.stringify(knowledgeBase)}
            分析要求：${options?.custom_prompt || '请提供详细的分析报告'}`,
          },
          {
            role: 'user',
            content: `测试类型：${modelType}\n用户回答：${JSON.stringify(answers)}`,
          },
        ],
      };

      // 调用 AI 服务进行分析
      const response = await aiService.analyze(request);

      if (!response.success) {
        throw new Error(response.error || '分析失败');
      }

      // 解析 AI 响应
      const result = JSON.parse(response.result || '{}');

      // 返回分析结果
      res.json({
        analysis: result.analysis || {},
        summary: result.summary || '',
        confidence_score: result.confidence_score || 0.8,
        knowledge_sources: result.knowledge_sources || [],
        processing_time: result.processing_time || 0,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : '分析过程中发生错误',
      });
    }
  }

  // 获取分析状态
  async getAnalysisStatus(req: Request, res: Response) {
    try {
      const { surveyId } = req.params;

      // 获取知识库服务
      const knowledgeBase = ServiceFactory.createKnowledgeBase({
        type: 'supabase',
        connection_string: process.env.SUPABASE_CONNECTION_STRING || '',
        database: process.env.SUPABASE_DATABASE || '',
      });

      // 从知识库获取分析结果
      const entries = await knowledgeBase.getEntries(surveyId);
      const latestResult = entries[0];

      if (!latestResult) {
        return res.json({
          status: 'pending',
          message: '分析尚未完成',
        });
      }

      res.json({
        status: 'completed',
        result: latestResult.content,
        timestamp: latestResult.created_at,
      });
    } catch (error) {
      console.error('Status check error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : '获取分析状态时发生错误',
      });
    }
  }
} 