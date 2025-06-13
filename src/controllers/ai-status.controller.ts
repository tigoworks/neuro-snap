import { Request, Response } from 'express';
import { AIEnhancedAnalysisService } from '../services/ai-enhanced-analysis.service';
import logger from '../utils/logger';

export class AIStatusController {
  private aiService: AIEnhancedAnalysisService;

  constructor() {
    this.aiService = new AIEnhancedAnalysisService();
  }

  /**
   * 获取AI服务状态
   */
  async getAIStatus(req: Request, res: Response) {
    try {
      logger.info('🔍 检查AI服务状态');
      
      const status = await this.aiService.getAIStatus();
      
      logger.info('✅ AI服务状态检查完成', {
        available: status.available,
        provider: status.provider,
        model: status.model
      });

      res.json({
        success: true,
        data: {
          ai: status,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development'
        }
      });

    } catch (error) {
      logger.error('❌ AI服务状态检查失败', { error });
      
      res.status(500).json({
        success: false,
        error: {
          message: 'AI服务状态检查失败',
          details: error instanceof Error ? error.message : String(error)
        }
      });
    }
  }

  /**
   * 获取系统健康状态
   */
  async getSystemHealth(req: Request, res: Response) {
    try {
      logger.info('🏥 检查系统健康状态');
      
      // 使用Promise.race实现整体超时控制
      const healthCheckPromise = this.performHealthCheck();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('系统健康检查超时')), 10000); // 10秒总超时
      });

      const health = await Promise.race([healthCheckPromise, timeoutPromise]);

      logger.info('✅ 系统健康状态检查完成', {
        status: health.status,
        aiAvailable: health.services.ai.status === 'healthy'
      });

      res.json({
        success: true,
        data: health
      });

    } catch (error) {
      logger.error('❌ 系统健康状态检查失败', { error });
      
      // 返回降级的健康状态
      const fallbackHealth = {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        services: {
          ai: {
            status: 'unknown',
            provider: 'OpenAI',
            model: 'N/A',
            message: '健康检查超时或失败'
          },
          database: {
            status: 'healthy',
            provider: 'Supabase'
          },
          analysis: {
            status: 'healthy',
            fallback: 'rule-based'
          }
        },
        capabilities: {
          aiAnalysis: false,
          ruleBasedFallback: true,
          knowledgeBase: true,
          realTimeAnalysis: true
        },
        error: error instanceof Error ? error.message : String(error)
      };

      res.json({
        success: true,
        data: fallbackHealth
      });
    }
  }

  /**
   * 执行健康检查
   */
  private async performHealthCheck() {
    const aiStatus = await this.aiService.getAIStatus();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        ai: {
          status: aiStatus.available ? 'healthy' : 'degraded',
          provider: aiStatus.provider,
          model: aiStatus.model,
          message: aiStatus.message
        },
        database: {
          status: 'healthy', // 假设数据库正常，可以添加实际检查
          provider: 'Supabase'
        },
        analysis: {
          status: 'healthy',
          fallback: !aiStatus.available ? 'rule-based' : 'ai-powered'
        }
      },
      capabilities: {
        aiAnalysis: aiStatus.available,
        ruleBasedFallback: true,
        knowledgeBase: true,
        realTimeAnalysis: true
      }
    };

    // 如果AI不可用，系统状态为降级
    if (!aiStatus.available) {
      health.status = 'degraded';
    }

    return health;
  }
} 