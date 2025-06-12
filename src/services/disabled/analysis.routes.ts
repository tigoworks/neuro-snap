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

// AI分析相关路由
router.post('/generate', analysisController.generateAnalysis.bind(analysisController));
router.post('/preview', analysisController.previewAnalysis.bind(analysisController));
router.get('/:analysisId', analysisController.getAnalysis.bind(analysisController));
router.delete('/:analysisId', analysisController.deleteAnalysis.bind(analysisController));
router.get('/user/:userId/history', analysisController.getAnalysisHistory.bind(analysisController));

// 知识库相关路由
router.get('/knowledge/stats', analysisController.getKnowledgeStats.bind(analysisController));
router.get('/knowledge/search', analysisController.searchKnowledge.bind(analysisController));
router.post('/knowledge/import/file', analysisController.importFile.bind(analysisController));
router.post('/knowledge/import/url', analysisController.importFromUrl.bind(analysisController));

export default router; 