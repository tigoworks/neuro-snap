"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = __importDefault(require("../middleware/auth.middleware"));
const express_rate_limit_1 = require("express-rate-limit");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
// 认证相关的速率限制 - 更严格
const authLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 5, // 每15分钟最多5次尝试
    message: 'Too many authentication attempts, please try again later.',
});
// 公开路由 - 不需要认证
router.post('/register', authLimiter, (req, res) => authController.register(req, res));
router.post('/login', authLimiter, (req, res) => authController.login(req, res));
router.post('/refresh', authLimiter, (req, res) => authController.refreshToken(req, res));
// 需要认证的路由
router.get('/validate', auth_middleware_1.default.supabaseAuth, (req, res) => authController.validateToken(req, res));
router.post('/logout', auth_middleware_1.default.supabaseAuth, (req, res) => authController.logout(req, res));
router.get('/me', auth_middleware_1.default.supabaseAuth, (req, res) => authController.getCurrentUser(req, res));
exports.default = router;
