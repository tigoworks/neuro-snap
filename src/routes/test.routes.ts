import express from 'express';
import { SupabaseService } from '../services/supabase.service';
import logger from '../utils/logger';

const router = express.Router();

// 测试 Supabase 连接
router.get('/db', async (req, res) => {
  try {
    logger.info('Testing database connection...');
    
    // 直接使用 Supabase 服务测试连接
    const supabaseService = SupabaseService.getInstance();
    logger.info('Supabase service instance created');

    // 尝试获取数据
    logger.info('Attempting to fetch entries from survey_model table...');
    const { data: entries, error } = await supabaseService.getClient()
      .from('survey_model')
      .select('*')
      .limit(5);

    if (error) {
      throw error;
    }

    logger.info(`Successfully fetched ${entries?.length || 0} entries`);

    res.json({
      status: 'success',
      data: entries || [],
      message: `Database connection successful. Found ${entries?.length || 0} survey models.`
    });
  } catch (error) {
    logger.error('Database connection test failed:', error);
    logger.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    res.status(500).json({
      status: 'error',
      message: '数据库连接失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 测试基础分析功能
router.get('/analysis', async (req, res) => {
  try {
    logger.info('Testing basic analysis functionality...');
    
    res.json({
      status: 'success',
      message: '基础分析功能可用',
      endpoints: [
        'POST /api/analysis/basic/generate - 生成基础分析',
        'GET /api/analysis/basic/preview/:userId - 预览分析结果',
        'GET /api/analysis/basic/stats - 获取分析统计'
      ]
    });
  } catch (error) {
    logger.error('Analysis test failed:', error);
    res.status(500).json({
      status: 'error',
      message: '分析功能测试失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 