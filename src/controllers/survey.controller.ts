import { Request, Response } from 'express';
import { SupabaseService } from '../services/supabase.service';

export class SurveyController {
  private supabaseService: SupabaseService;

  constructor() {
    this.supabaseService = SupabaseService.getInstance();
  }

  // 获取测试题目接口 - GET /api/survey/model?code={type}
  async getSurveyQuestions(req: Request, res: Response) {
    try {
      const { code } = req.query;

      if (!code) {
        return res.status(400).json({
          error: 'Model code is required',
        });
      }

      // 获取模型信息
      const { data: modelData, error: modelError } = await this.supabaseService.getClient()
        .from('survey_model')
        .select('*')
        .eq('code', code as string)
        .single();

      if (modelError || !modelData) {
        return res.status(404).json({
          error: 'Model not found',
        });
      }

      // 获取该模型的所有题目
      const { data: questionsData, error: questionsError } = await this.supabaseService.getClient()
        .from('survey_question')
        .select('*')
        .eq('model_id', modelData.id)
        .order('sort_order', { ascending: true });

      if (questionsError) {
        throw questionsError;
      }

      if (!questionsData || questionsData.length === 0) {
        return res.status(404).json({
          error: 'No questions found for this model',
        });
      }

      // 格式化响应数据
      const questions = questionsData.map((q: any) => ({
        id: q.id,
        question_code: q.question_code,
        content: q.content,
        options: q.options, // 已经是JSONB格式，直接返回
        type: q.type,
        sort_order: q.sort_order,
        required: q.required
      }));

      // 返回标准格式
      res.json({
        model: {
          id: modelData.id,
          name: modelData.name,
          description: modelData.description,
        },
        questions: questions,
      });
    } catch (error) {
      console.error('Error in survey questions API:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : '获取调查问卷时发生错误',
      });
    }
  }

  // 获取所有模型 - 保留原有功能，可能前端需要
  async getAllModels(req: Request, res: Response) {
    try {
      const { data: modelsData, error } = await this.supabaseService.getClient()
        .from('survey_model')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      if (!modelsData || modelsData.length === 0) {
        return res.status(404).json({
          error: 'No models found',
        });
      }

      res.json({ models: modelsData });
    } catch (error) {
      console.error('Error getting all models:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : '获取模型列表时发生错误',
      });
    }
  }
} 