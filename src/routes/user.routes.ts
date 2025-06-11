import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { rateLimit } from 'express-rate-limit';
import config from '../config';

const router = Router();
const userController = new UserController();

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rate_limit, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Apply rate limiting to all routes
router.use(limiter);

// User routes
router.post('/info', (req, res) => userController.saveUserInfo(req, res));
router.get('/info/:userId', (req, res) => userController.getUserInfo(req, res));

export default router; 