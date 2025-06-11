import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import authMiddleware from '../middleware/auth.middleware';
import { rateLimit } from 'express-rate-limit';

const router = Router();
const authController = new AuthController();

// 认证相关的速率限制 - 更严格
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 每15分钟最多5次尝试
  message: 'Too many authentication attempts, please try again later.',
});

// 公开路由 - 不需要认证
router.post('/register', authLimiter, (req, res) => authController.register(req, res));
router.post('/login', authLimiter, (req, res) => authController.login(req, res));
router.post('/refresh', authLimiter, (req, res) => authController.refreshToken(req, res));

// 需要认证的路由
router.get('/validate', authMiddleware.supabaseAuth, (req, res) => authController.validateToken(req, res));
router.post('/logout', authMiddleware.supabaseAuth, (req, res) => authController.logout(req, res));
router.get('/me', authMiddleware.supabaseAuth, (req, res) => authController.getCurrentUser(req, res));

export default router; 