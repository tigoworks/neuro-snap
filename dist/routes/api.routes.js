"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const survey_controller_1 = require("../controllers/survey.controller");
const test_controller_1 = require("../controllers/test.controller");
const auth_middleware_1 = __importDefault(require("../middleware/auth.middleware"));
const app_protection_middleware_1 = __importDefault(require("../middleware/app-protection.middleware"));
const express_rate_limit_1 = require("express-rate-limit");
const config_1 = __importDefault(require("../config"));
const router = (0, express_1.Router)();
const surveyController = new survey_controller_1.SurveyController();
const testController = new test_controller_1.TestController();
// 基础速率限制 - 作为最后防线
const baseLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: config_1.default.rate_limit,
    message: 'Too many requests from this IP, please try again later.',
});
// 应用前端保护中间件
const frontendProtection = app_protection_middleware_1.default.createProtection('standard');
// 将数组中间件展开应用
router.use(baseLimiter);
router.use(...frontendProtection);
// API routes matching frontend specifications
// 获取测试题目接口 - GET /api/survey-questions?model={type}
// 使用可选鉴权：有用户则记录，无用户也可以访问
router.get('/survey-questions', auth_middleware_1.default.optionalAuth, (req, res) => surveyController.getSurveyQuestions(req, res));
// 提交测试结果接口 - POST /api/submit-test
// 使用可选鉴权：匿名用户也可以提交，但已登录用户会关联到账户
router.post('/submit-test', auth_middleware_1.default.optionalAuth, (req, res) => testController.submitTest(req, res));
exports.default = router;
