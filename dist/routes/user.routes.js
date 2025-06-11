"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const express_rate_limit_1 = require("express-rate-limit");
const config_1 = __importDefault(require("../config"));
const router = (0, express_1.Router)();
const userController = new user_controller_1.UserController();
// Rate limiting middleware
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: config_1.default.rate_limit, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});
// Apply rate limiting to all routes
router.use(limiter);
// User routes
router.post('/info', (req, res) => userController.saveUserInfo(req, res));
router.get('/info/:userId', (req, res) => userController.getUserInfo(req, res));
exports.default = router;
