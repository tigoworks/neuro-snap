"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const simple_analysis_controller_1 = require("../controllers/simple-analysis.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const simpleAnalysisController = new simple_analysis_controller_1.SimpleAnalysisController();
const authMiddleware = new auth_middleware_1.AuthMiddleware();
// 设置速率限制
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 50, // 每15分钟最多50个请求
    message: {
        error: '请求过于频繁，请稍后重试',
        code: 'RATE_LIMIT_EXCEEDED'
    }
});
// 基础分析路由
router.post('/basic/generate', limiter, authMiddleware.optionalAuth, simpleAnalysisController.generateAnalysis.bind(simpleAnalysisController));
router.get('/basic/preview/:userId', authMiddleware.optionalAuth, simpleAnalysisController.previewAnalysis.bind(simpleAnalysisController));
router.get('/basic/stats', authMiddleware.optionalAuth, simpleAnalysisController.getAnalysisStats.bind(simpleAnalysisController));
exports.default = router;
