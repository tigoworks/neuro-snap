"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const survey_controller_1 = require("../controllers/survey.controller");
const test_controller_1 = require("../controllers/test.controller");
const express_rate_limit_1 = require("express-rate-limit");
const config_1 = __importDefault(require("../config"));
const router = (0, express_1.Router)();
const surveyController = new survey_controller_1.SurveyController();
const testController = new test_controller_1.TestController();
// Rate limiting middleware
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: config_1.default.rate_limit, // Limit each IP to requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});
// Apply rate limiting to all routes
router.use(limiter);
// API routes matching frontend specifications
// 获取测试题目接口 - GET /api/survey-questions?model={type}
router.get('/survey-questions', (req, res) => surveyController.getSurveyQuestions(req, res));
// 提交测试结果接口 - POST /api/submit-test
router.post('/submit-test', (req, res) => testController.submitTest(req, res));
exports.default = router;
