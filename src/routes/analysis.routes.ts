import { Router } from 'express';
import { AnalysisController } from '../controllers/analysis.controller';
import { rateLimit } from 'express-rate-limit';
import config from '../config';

const router = Router();
const analysisController = new AnalysisController();

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rate_limit, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Apply rate limiting to all routes
router.use(limiter);

// Analysis routes
router.post('/analyze', (req, res) => analysisController.analyzeAnswers(req, res));
router.get('/status/:surveyId', (req, res) => analysisController.getAnalysisStatus(req, res));

export default router; 