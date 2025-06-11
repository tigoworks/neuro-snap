import express from 'express';
import { ServiceFactory } from '../services/factory';
import logger from '../utils/logger';

const router = express.Router();

// 测试 Supabase 连接
router.get('/db', async (req, res) => {
  try {
    logger.info('Testing database connection...');
    
    // 创建知识库服务实例
    const knowledgeBase = ServiceFactory.createKnowledgeBase({
      type: 'supabase',
    });
    logger.info('Knowledge base service created');

    // 尝试获取数据
    logger.info('Attempting to fetch entries from survey_model table...');
    const entries = await knowledgeBase.getEntries('survey_model');
    logger.info(`Successfully fetched ${entries.length} entries`);

    res.json({
      status: 'success',
      data: entries,
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

export default router; 