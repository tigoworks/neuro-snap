"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supabase_service_1 = require("../services/supabase.service");
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
class AuthMiddleware {
    constructor() {
        // 1. API Key 鉴权 - 适用于服务间调用
        this.apiKeyAuth = (req, res, next) => {
            try {
                const apiKey = req.headers['x-api-key'];
                if (!apiKey) {
                    return res.status(401).json({
                        error: 'API key is required',
                        code: 'MISSING_API_KEY'
                    });
                }
                // 验证API Key
                if (apiKey !== config_1.default.auth.api_key) {
                    return res.status(401).json({
                        error: 'Invalid API key',
                        code: 'INVALID_API_KEY'
                    });
                }
                logger_1.default.info('API key authentication successful');
                next();
            }
            catch (error) {
                logger_1.default.error('API key authentication error:', error);
                res.status(500).json({
                    error: 'Authentication server error',
                    code: 'AUTH_SERVER_ERROR'
                });
            }
        };
        // 2. JWT Token 鉴权 - 适用于用户会话
        this.jwtAuth = (req, res, next) => {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return res.status(401).json({
                        error: 'Bearer token is required',
                        code: 'MISSING_TOKEN'
                    });
                }
                const token = authHeader.substring(7); // Remove "Bearer " prefix
                // 验证JWT Token
                const decoded = jsonwebtoken_1.default.verify(token, config_1.default.auth.jwt_secret);
                req.user = {
                    id: decoded.sub || decoded.userId,
                    email: decoded.email,
                    role: decoded.role || 'user'
                };
                logger_1.default.info(`JWT authentication successful for user: ${req.user.id}`);
                next();
            }
            catch (error) {
                if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                    return res.status(401).json({
                        error: 'Invalid token',
                        code: 'INVALID_TOKEN'
                    });
                }
                logger_1.default.error('JWT authentication error:', error);
                res.status(500).json({
                    error: 'Authentication server error',
                    code: 'AUTH_SERVER_ERROR'
                });
            }
        };
        // 3. Supabase Auth 鉴权 - 与Supabase用户系统集成
        this.supabaseAuth = async (req, res, next) => {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return res.status(401).json({
                        error: 'Authorization header is required',
                        code: 'MISSING_AUTH_HEADER'
                    });
                }
                const token = authHeader.substring(7);
                // 使用Supabase验证token
                const { data: { user }, error } = await this.supabaseService.getClient().auth.getUser(token);
                if (error || !user) {
                    return res.status(401).json({
                        error: 'Invalid or expired token',
                        code: 'INVALID_SUPABASE_TOKEN'
                    });
                }
                req.user = {
                    id: user.id,
                    email: user.email,
                    role: user.user_metadata?.role || 'user'
                };
                logger_1.default.info(`Supabase authentication successful for user: ${req.user.id}`);
                next();
            }
            catch (error) {
                logger_1.default.error('Supabase authentication error:', error);
                res.status(500).json({
                    error: 'Authentication server error',
                    code: 'AUTH_SERVER_ERROR'
                });
            }
        };
        // 4. 可选鉴权 - 有token则验证，无token则跳过
        this.optionalAuth = async (req, res, next) => {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    // 没有token，继续执行但不设置用户信息
                    return next();
                }
                const token = authHeader.substring(7);
                try {
                    // 尝试验证Supabase token
                    const { data: { user }, error } = await this.supabaseService.getClient().auth.getUser(token);
                    if (!error && user) {
                        req.user = {
                            id: user.id,
                            email: user.email,
                            role: user.user_metadata?.role || 'user'
                        };
                        logger_1.default.info(`Optional auth successful for user: ${req.user.id}`);
                    }
                }
                catch (error) {
                    // Token验证失败，但不阻止请求继续
                    logger_1.default.warn('Optional auth failed, continuing without user info');
                }
                next();
            }
            catch (error) {
                logger_1.default.error('Optional authentication error:', error);
                // 即使出错也继续执行
                next();
            }
        };
        // 5. 管理员权限检查
        this.requireAdmin = (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Authentication required',
                    code: 'AUTHENTICATION_REQUIRED'
                });
            }
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    error: 'Admin privileges required',
                    code: 'INSUFFICIENT_PRIVILEGES'
                });
            }
            next();
        };
        // 6. 生成JWT Token的辅助方法
        this.generateJWT = (payload) => {
            return jsonwebtoken_1.default.sign({
                sub: payload.userId,
                email: payload.email,
                role: payload.role || 'user',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时过期
            }, config_1.default.auth.jwt_secret);
        };
        this.supabaseService = supabase_service_1.SupabaseService.getInstance();
    }
}
exports.AuthMiddleware = AuthMiddleware;
exports.default = new AuthMiddleware();
