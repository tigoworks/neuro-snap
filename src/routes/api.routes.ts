import { Router } from 'express';
import { SurveyController } from '../controllers/survey.controller';
import { TestController } from '../controllers/test.controller';
import authMiddleware from '../middleware/auth.middleware';
import appProtection from '../middleware/app-protection.middleware';
import { rateLimit } from 'express-rate-limit';
import config from '../config';

const router = Router();
const surveyController = new SurveyController();
const testController = new TestController();

// 基础速率限制 - 作为最后防线
const baseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rate_limit,
  message: 'Too many requests from this IP, please try again later.',
});

// 应用前端保护中间件
const frontendProtection = appProtection.createProtection('standard');

// 将数组中间件展开应用
router.use(baseLimiter);
router.use(...frontendProtection);

// API routes matching frontend specifications
// 获取测试题目接口 - GET /api/survey-questions?model={type}
// 使用可选鉴权：有用户则记录，无用户也可以访问
router.get('/survey-questions', authMiddleware.optionalAuth, (req, res) => surveyController.getSurveyQuestions(req, res));

// 提交测试结果接口 - POST /api/submit-test
// 使用可选鉴权：匿名用户也可以提交，但已登录用户会关联到账户
router.post('/submit-test', authMiddleware.optionalAuth, (req, res) => testController.submitTest(req, res));

export default router; 