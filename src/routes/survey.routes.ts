import { Router } from 'express';
import { SurveyController } from '../controllers/survey.controller';
import { rateLimit } from 'express-rate-limit';
import config from '../config';

const router = Router();
const surveyController = new SurveyController();

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rate_limit, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Apply rate limiting to all routes
router.use(limiter);

// Survey routes
router.get('/model', (req, res) => surveyController.getSurveyQuestions(req, res));
router.get('/models', (req, res) => surveyController.getAllModels(req, res));

export default router; 