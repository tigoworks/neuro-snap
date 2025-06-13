"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analysis_result_controller_1 = require("../controllers/analysis-result.controller");
const auth_middleware_1 = __importDefault(require("../middleware/auth.middleware"));
const smart_rate_limit_middleware_1 = __importDefault(require("../middleware/smart-rate-limit.middleware"));
const router = (0, express_1.Router)();
const analysisResultController = new analysis_result_controller_1.AnalysisResultController();
/**
 * @route GET /api/analysis/user/:userId
 * @description 获取用户最新的分析结果
 * @access Protected
 * @rateLimit 查询限制 - 支持轮询
 */
router.get('/user/:userId', smart_rate_limit_middleware_1.default.queryLimit, auth_middleware_1.default.optionalAuth, (req, res) => analysisResultController.getAnalysisByUserId(req, res));
/**
 * @route GET /api/analysis/:analysisId
 * @description 根据分析ID获取分析结果
 * @access Protected
 * @rateLimit 查询限制 - 支持轮询
 */
router.get('/:analysisId', smart_rate_limit_middleware_1.default.queryLimit, auth_middleware_1.default.optionalAuth, (req, res) => analysisResultController.getAnalysisById(req, res));
/**
 * @route GET /api/analysis/user/:userId/history
 * @description 获取用户的分析历史
 * @access Protected
 * @rateLimit 查询限制 - 支持轮询
 */
router.get('/user/:userId/history', smart_rate_limit_middleware_1.default.queryLimit, auth_middleware_1.default.optionalAuth, (req, res) => analysisResultController.getAnalysisHistory(req, res));
/**
 * @route GET /api/analysis/user/:userId/summary
 * @description 获取用户分析摘要
 * @access Protected
 * @rateLimit 查询限制 - 支持轮询
 */
router.get('/user/:userId/summary', smart_rate_limit_middleware_1.default.queryLimit, auth_middleware_1.default.optionalAuth, (req, res) => analysisResultController.getAnalysisSummary(req, res));
exports.default = router;
