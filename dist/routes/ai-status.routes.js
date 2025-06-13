"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_status_controller_1 = require("../controllers/ai-status.controller");
const app_protection_middleware_1 = require("../middleware/app-protection.middleware");
const router = (0, express_1.Router)();
const aiStatusController = new ai_status_controller_1.AIStatusController();
const appProtection = new app_protection_middleware_1.AppProtectionMiddleware();
// AI服务状态检查
router.get('/status', appProtection.frontendApiKey, aiStatusController.getAIStatus.bind(aiStatusController));
// 系统健康状态检查
router.get('/health', appProtection.frontendApiKey, aiStatusController.getSystemHealth.bind(aiStatusController));
exports.default = router;
