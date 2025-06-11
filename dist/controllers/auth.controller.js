"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const supabase_service_1 = require("../services/supabase.service");
const auth_middleware_1 = __importDefault(require("../middleware/auth.middleware"));
const logger_1 = __importDefault(require("../utils/logger"));
class AuthController {
    constructor() {
        this.supabaseService = supabase_service_1.SupabaseService.getInstance();
    }
    // 用户注册
    async register(req, res) {
        try {
            const { email, password, name } = req.body;
            if (!email || !password) {
                return res.status(400).json({
                    error: 'Email and password are required',
                    code: 'MISSING_CREDENTIALS'
                });
            }
            // 使用Supabase进行用户注册
            const { data, error } = await this.supabaseService.getClient().auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name || '',
                    }
                }
            });
            if (error) {
                return res.status(400).json({
                    error: error.message,
                    code: 'REGISTRATION_FAILED'
                });
            }
            logger_1.default.info(`User registered successfully: ${email}`);
            res.status(201).json({
                message: 'User registered successfully',
                user: {
                    id: data.user?.id,
                    email: data.user?.email,
                },
                session: data.session
            });
        }
        catch (error) {
            logger_1.default.error('Registration error:', error);
            res.status(500).json({
                error: 'Registration failed',
                code: 'SERVER_ERROR'
            });
        }
    }
    // 用户登录
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({
                    error: 'Email and password are required',
                    code: 'MISSING_CREDENTIALS'
                });
            }
            // 使用Supabase进行用户登录
            const { data, error } = await this.supabaseService.getClient().auth.signInWithPassword({
                email,
                password
            });
            if (error) {
                return res.status(401).json({
                    error: error.message,
                    code: 'LOGIN_FAILED'
                });
            }
            // 也可以生成自定义JWT token
            const customToken = auth_middleware_1.default.generateJWT({
                userId: data.user.id,
                email: data.user.email,
                role: data.user.user_metadata?.role || 'user'
            });
            logger_1.default.info(`User logged in successfully: ${email}`);
            res.json({
                message: 'Login successful',
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    role: data.user.user_metadata?.role || 'user'
                },
                // Supabase session token
                session: data.session,
                // 自定义JWT token (可选)
                token: customToken
            });
        }
        catch (error) {
            logger_1.default.error('Login error:', error);
            res.status(500).json({
                error: 'Login failed',
                code: 'SERVER_ERROR'
            });
        }
    }
    // 验证token
    async validateToken(req, res) {
        try {
            // 这个方法会被auth middleware调用后执行
            // req.user 已经被设置
            res.json({
                valid: true,
                user: req.user
            });
        }
        catch (error) {
            logger_1.default.error('Token validation error:', error);
            res.status(500).json({
                error: 'Token validation failed',
                code: 'SERVER_ERROR'
            });
        }
    }
    // 刷新token
    async refreshToken(req, res) {
        try {
            const { refresh_token } = req.body;
            if (!refresh_token) {
                return res.status(400).json({
                    error: 'Refresh token is required',
                    code: 'MISSING_REFRESH_TOKEN'
                });
            }
            const { data, error } = await this.supabaseService.getClient().auth.refreshSession({
                refresh_token
            });
            if (error) {
                return res.status(401).json({
                    error: error.message,
                    code: 'REFRESH_FAILED'
                });
            }
            res.json({
                message: 'Token refreshed successfully',
                session: data.session
            });
        }
        catch (error) {
            logger_1.default.error('Token refresh error:', error);
            res.status(500).json({
                error: 'Token refresh failed',
                code: 'SERVER_ERROR'
            });
        }
    }
    // 登出
    async logout(req, res) {
        try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                // 使用Supabase登出
                await this.supabaseService.getClient().auth.signOut();
            }
            res.json({
                message: 'Logout successful'
            });
        }
        catch (error) {
            logger_1.default.error('Logout error:', error);
            res.status(500).json({
                error: 'Logout failed',
                code: 'SERVER_ERROR'
            });
        }
    }
    // 获取当前用户信息
    async getCurrentUser(req, res) {
        try {
            res.json({
                user: req.user
            });
        }
        catch (error) {
            logger_1.default.error('Get current user error:', error);
            res.status(500).json({
                error: 'Failed to get user info',
                code: 'SERVER_ERROR'
            });
        }
    }
}
exports.AuthController = AuthController;
