import { Request, Response } from 'express';
import { SupabaseService } from '../services/supabase.service';
import { databaseLogger } from '../services/database-logger.service';
import logger from '../utils/logger';

export class AnalysisResultController {
  private supabaseService: SupabaseService;

  constructor() {
    this.supabaseService = SupabaseService.getInstance();
  }

  /**
   * 根据用户ID获取最新的分析结果
   */
  async getAnalysisByUserId(req: Request, res: Response) {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        error: '缺少用户ID',
        code: 'MISSING_USER_ID'
      });
    }

    const queryId = databaseLogger.logQueryStart({
      table: 'analysis_results',
      operation: 'SELECT',
      filters: { user_id: userId }
    });

    try {
      const client = this.supabaseService.getClient();
      
      // 首先检查分析结果
      const { data, error } = await client
        .from('analysis_results')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 没有找到分析结果，检查是否有用户提交记录
          const { data: userSurvey, error: surveyError } = await client
            .from('user_survey')
            .select('id, submit_time')
            .eq('id', userId)
            .single();

          databaseLogger.logQuerySuccess(queryId, [], Date.now(), {
            table: 'analysis_results',
            operation: 'SELECT'
          });

          if (surveyError) {
            if (surveyError.code === 'PGRST116') {
              // 用户不存在
              logger.info('📋 用户不存在', { userId });
              return res.status(404).json({
                success: false,
                error: '用户不存在',
                code: 'USER_NOT_FOUND'
              });
            }
            
            // 记录其他类型的错误
            logger.error('❌ 查询用户信息失败', {
              userId,
              error: {
                code: surveyError.code,
                message: surveyError.message
              }
            });
            throw surveyError;
          }

          // 用户存在但没有分析结果，说明分析正在进行中
          const submittedAt = new Date(userSurvey.submit_time);
          const now = new Date();
          const elapsedMinutes = Math.round((now.getTime() - submittedAt.getTime()) / 60000);

          return res.json({
            success: true,
            data: {
              status: 'processing',
              message: `分析正在进行中，已用时${elapsedMinutes}分钟`,
              submittedAt: userSurvey.submit_time,
              elapsedTime: `${elapsedMinutes}分钟`,
              estimatedCompletion: '通常需要2-5分钟'
            }
          });
        }
        
        throw error;
      }

      databaseLogger.logQuerySuccess(queryId, data, Date.now(), {
        table: 'analysis_results',
        operation: 'SELECT'
      });

      // 格式化返回数据
      const analysisResult = {
        id: data.id,
        userId: data.user_id,
        analysisType: 'comprehensive',
        summary: data.result_summary,
        detailedAnalysis: data.result_json?.detailed_analysis,
        recommendations: data.result_json?.recommendations || [],
        confidenceScore: data.result_json?.confidence_score || 0,
        knowledgeSources: data.result_json?.knowledge_sources || [],
        processingTime: data.result_json?.processing_time_ms || 0,
        createdAt: data.completed_at,
        modelCode: data.model_code
      };

      logger.info('📊 分析结果查询成功', {
        userId,
        analysisId: data.id,
        confidenceScore: analysisResult.confidenceScore,
        recommendationsCount: analysisResult.recommendations.length
      });

      res.json({
        success: true,
        data: {
          status: 'completed',
          analysis: analysisResult
        }
      });

    } catch (error) {
      databaseLogger.logQueryError(queryId, error, Date.now(), {
        table: 'analysis_results',
        operation: 'SELECT'
      });

      logger.error('❌ 分析结果查询失败', {
        userId,
        error: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          code: error && typeof error === 'object' && 'code' in error ? (error as any).code : 'UNKNOWN'
        }
      });

      res.status(500).json({
        error: '获取分析结果失败',
        details: error instanceof Error ? error.message : String(error),
        code: 'ANALYSIS_FETCH_FAILED'
      });
    }
  }

  /**
   * 根据分析ID获取分析结果
   */
  async getAnalysisById(req: Request, res: Response) {
    const { analysisId } = req.params;
    
    if (!analysisId) {
      return res.status(400).json({
        error: '缺少分析ID',
        code: 'MISSING_ANALYSIS_ID'
      });
    }

    const queryId = databaseLogger.logQueryStart({
      table: 'analysis_results',
      operation: 'SELECT',
      filters: { id: analysisId }
    });

    try {
      const client = this.supabaseService.getClient();
      
      const { data, error } = await client
        .from('analysis_results')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          databaseLogger.logQuerySuccess(queryId, [], Date.now(), {
            table: 'analysis_results',
            operation: 'SELECT'
          });

          return res.status(404).json({
            error: '分析结果不存在',
            code: 'ANALYSIS_NOT_FOUND'
          });
        }
        
        throw error;
      }

      databaseLogger.logQuerySuccess(queryId, data, Date.now(), {
        table: 'analysis_results',
        operation: 'SELECT'
      });

      // 格式化返回数据
      const analysisResult = {
        id: data.id,
        userId: data.user_id,
        analysisType: 'comprehensive',
        summary: data.result_summary,
        detailedAnalysis: data.result_json?.detailed_analysis,
        recommendations: data.result_json?.recommendations || [],
        confidenceScore: data.result_json?.confidence_score || 0,
        knowledgeSources: data.result_json?.knowledge_sources || [],
        processingTime: data.result_json?.processing_time_ms || 0,
        createdAt: data.completed_at,
        modelCode: data.model_code
      };

      logger.info('📊 分析结果查询成功', {
        analysisId,
        userId: data.user_id,
        confidenceScore: analysisResult.confidenceScore
      });

      res.json({
        success: true,
        data: analysisResult
      });

    } catch (error) {
      databaseLogger.logQueryError(queryId, error, Date.now(), {
        table: 'analysis_results',
        operation: 'SELECT'
      });

      logger.error('❌ 分析结果查询失败', {
        analysisId,
        error: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error)
        }
      });

      res.status(500).json({
        error: '获取分析结果失败',
        details: error instanceof Error ? error.message : String(error),
        code: 'ANALYSIS_FETCH_FAILED'
      });
    }
  }

  /**
   * 获取用户的所有分析历史
   */
  async getAnalysisHistory(req: Request, res: Response) {
    const { userId } = req.params;
    const { limit = '10', offset = '0' } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        error: '缺少用户ID',
        code: 'MISSING_USER_ID'
      });
    }

    const queryId = databaseLogger.logQueryStart({
      table: 'analysis_results',
      operation: 'SELECT',
      filters: { user_id: userId, limit, offset }
    });

    try {
      const client = this.supabaseService.getClient();
      
      const { data, error, count } = await client
        .from('analysis_results')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      if (error) {
        throw error;
      }

      databaseLogger.logQuerySuccess(queryId, data, Date.now(), {
        table: 'analysis_results',
        operation: 'SELECT'
      });

      // 格式化返回数据
      const analysisHistory = (data || []).map(item => ({
        id: item.id,
        summary: item.result_summary,
        confidenceScore: item.result_json?.confidence_score || 0,
        processingTime: item.result_json?.processing_time_ms || 0,
        createdAt: item.completed_at,
        modelCode: item.model_code
      }));

      logger.info('📊 分析历史查询成功', {
        userId,
        totalCount: count,
        returnedCount: analysisHistory.length
      });

      res.json({
        success: true,
        data: {
          history: analysisHistory,
          pagination: {
            total: count || 0,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            hasMore: (count || 0) > parseInt(offset as string) + parseInt(limit as string)
          }
        }
      });

    } catch (error) {
      databaseLogger.logQueryError(queryId, error, Date.now(), {
        table: 'analysis_results',
        operation: 'SELECT'
      });

      logger.error('❌ 分析历史查询失败', {
        userId,
        error: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error)
        }
      });

      res.status(500).json({
        error: '获取分析历史失败',
        details: error instanceof Error ? error.message : String(error),
        code: 'ANALYSIS_HISTORY_FETCH_FAILED'
      });
    }
  }

  /**
   * 生成分析报告摘要
   */
  async getAnalysisSummary(req: Request, res: Response) {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        error: '缺少用户ID',
        code: 'MISSING_USER_ID'
      });
    }

    try {
      const client = this.supabaseService.getClient();
      
      // 获取最新分析结果
      const { data: analysisData, error: analysisError } = await client
        .from('analysis_results')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      if (analysisError) {
        if (analysisError.code === 'PGRST116') {
          return res.json({
            success: true,
            data: {
              status: 'no_analysis',
              message: '暂无分析结果'
            }
          });
        }
        throw analysisError;
      }

      // 获取用户基本信息
      const { data: userData, error: userError } = await client
        .from('user_survey')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        throw userError;
      }

      // 生成摘要
      const summary = {
        userInfo: {
          name: userData.name,
          age: userData.age,
          occupation: userData.occupation,
          education: userData.education
        },
        analysisOverview: {
          summary: analysisData.result_summary,
          confidenceScore: analysisData.result_json?.confidence_score || 0,
          recommendationsCount: analysisData.result_json?.recommendations?.length || 0,
          knowledgeSourcesCount: analysisData.result_json?.knowledge_sources?.length || 0,
          processingTime: analysisData.result_json?.processing_time_ms || 0,
          createdAt: analysisData.completed_at
        },
        keyRecommendations: (analysisData.result_json?.recommendations || []).slice(0, 3),
        nextSteps: [
          '查看详细分析报告',
          '制定个人发展计划',
          '定期回顾和调整目标'
        ]
      };

      logger.info('📋 分析摘要生成成功', {
        userId,
        analysisId: analysisData.id,
        confidenceScore: summary.analysisOverview.confidenceScore
      });

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      logger.error('❌ 分析摘要生成失败', {
        userId,
        error: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error)
        }
      });

      res.status(500).json({
        error: '获取分析摘要失败',
        details: error instanceof Error ? error.message : String(error),
        code: 'ANALYSIS_SUMMARY_FAILED'
      });
    }
  }
} 