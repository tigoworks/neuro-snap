import { Router } from 'express';
import { AIStatusController } from '../controllers/ai-status.controller';
import { AppProtectionMiddleware } from '../middleware/app-protection.middleware';

const router = Router();
const aiStatusController = new AIStatusController();
const appProtection = new AppProtectionMiddleware();

// AI服务状态检查
router.get('/status', appProtection.frontendApiKey, aiStatusController.getAIStatus.bind(aiStatusController));

// 系统健康状态检查
router.get('/health', appProtection.frontendApiKey, aiStatusController.getSystemHealth.bind(aiStatusController));

export default router; 