import { Router } from 'express';
import { AnswerController } from '../controllers/answer.controller';
import { rateLimit } from 'express-rate-limit';
import config from '../config';

const router = Router();
const answerController = new AnswerController();

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rate_limit, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Apply rate limiting to all routes
router.use(limiter);

// Answer routes
router.post('/submit', (req, res) => answerController.submitAnswers(req, res));

export default router; 