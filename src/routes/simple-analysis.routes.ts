import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { SimpleAnalysisController } from '../controllers/simple-analysis.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

const router = Router();
const simpleAnalysisController = new SimpleAnalysisController();
const authMiddleware = new AuthMiddleware();

// 设置速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 50, // 每15分钟最多50个请求
  message: {
    error: '请求过于频繁，请稍后重试',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// 基础分析路由
router.post('/basic/generate', 
  limiter,
  authMiddleware.optionalAuth,
  simpleAnalysisController.generateAnalysis.bind(simpleAnalysisController)
);

router.get('/basic/preview/:userId', 
  authMiddleware.optionalAuth,
  simpleAnalysisController.previewAnalysis.bind(simpleAnalysisController)
);

router.get('/basic/stats', 
  authMiddleware.optionalAuth,
  simpleAnalysisController.getAnalysisStats.bind(simpleAnalysisController)
);

export default router; 