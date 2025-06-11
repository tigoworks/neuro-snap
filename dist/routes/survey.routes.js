"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const survey_controller_1 = require("../controllers/survey.controller");
const express_rate_limit_1 = require("express-rate-limit");
const config_1 = __importDefault(require("../config"));
const router = (0, express_1.Router)();
const surveyController = new survey_controller_1.SurveyController();
// Rate limiting middleware
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: config_1.default.rate_limit, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});
// Apply rate limiting to all routes
router.use(limiter);
// Survey routes
router.get('/model', (req, res) => surveyController.getSurveyQuestions(req, res));
router.get('/models', (req, res) => surveyController.getAllModels(req, res));
exports.default = router;
