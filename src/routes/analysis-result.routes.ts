import { Router } from 'express';
import { AnalysisResultController } from '../controllers/analysis-result.controller';
import authMiddleware from '../middleware/auth.middleware';
import SmartRateLimitMiddleware from '../middleware/smart-rate-limit.middleware';

const router = Router();
const analysisResultController = new AnalysisResultController();

/**
 * @route GET /api/analysis/user/:userId
 * @description 获取用户最新的分析结果
 * @access Protected
 * @rateLimit 查询限制 - 支持轮询
 */
router.get('/user/:userId', 
  SmartRateLimitMiddleware.queryLimit,
  authMiddleware.optionalAuth, 
  (req, res) => analysisResultController.getAnalysisByUserId(req, res)
);

/**
 * @route GET /api/analysis/:analysisId
 * @description 根据分析ID获取分析结果
 * @access Protected
 * @rateLimit 查询限制 - 支持轮询
 */
router.get('/:analysisId', 
  SmartRateLimitMiddleware.queryLimit,
  authMiddleware.optionalAuth, 
  (req, res) => analysisResultController.getAnalysisById(req, res)
);

/**
 * @route GET /api/analysis/user/:userId/history
 * @description 获取用户的分析历史
 * @access Protected
 * @rateLimit 查询限制 - 支持轮询
 */
router.get('/user/:userId/history', 
  SmartRateLimitMiddleware.queryLimit,
  authMiddleware.optionalAuth, 
  (req, res) => analysisResultController.getAnalysisHistory(req, res)
);

/**
 * @route GET /api/analysis/user/:userId/summary
 * @description 获取用户分析摘要
 * @access Protected
 * @rateLimit 查询限制 - 支持轮询
 */
router.get('/user/:userId/summary', 
  SmartRateLimitMiddleware.queryLimit,
  authMiddleware.optionalAuth, 
  (req, res) => analysisResultController.getAnalysisSummary(req, res)
);

export default router; 