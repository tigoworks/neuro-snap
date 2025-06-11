"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppProtectionMiddleware = void 0;
const crypto_1 = __importDefault(require("crypto"));
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
// 存储请求信息的内存缓存（生产环境建议使用Redis）
const requestCache = new Map();
class AppProtectionMiddleware {
    constructor() {
        // 1. Origin/Referer 检查 - 验证请求来源
        this.originCheck = (req, res, next) => {
            try {
                const origin = req.get('origin');
                const referer = req.get('referer');
                const allowedOrigins = config_1.default.security.allowed_origins;
                // 开发环境放宽限制
                if (config_1.default.env === 'development') {
                    return next();
                }
                // 检查Origin
                if (origin && allowedOrigins.includes(origin)) {
                    return next();
                }
                // 检查Referer（备选方案）
                if (referer) {
                    const refererOrigin = new URL(referer).origin;
                    if (allowedOrigins.includes(refererOrigin)) {
                        return next();
                    }
                }
                logger_1.default.warn(`Blocked request from unauthorized origin: ${origin || 'unknown'}, referer: ${referer || 'unknown'}`);
                return res.status(403).json({
                    error: 'Access denied: Unauthorized origin',
                    code: 'UNAUTHORIZED_ORIGIN'
                });
            }
            catch (error) {
                logger_1.default.error('Origin check error:', error);
                return res.status(500).json({
                    error: 'Security check failed',
                    code: 'SECURITY_ERROR'
                });
            }
        };
        // 2. 前端应用API Key验证
        this.frontendApiKey = (req, res, next) => {
            try {
                const apiKey = req.get('x-app-key') || req.get('x-frontend-key');
                if (!apiKey) {
                    return res.status(401).json({
                        error: 'Frontend API key required',
                        code: 'MISSING_FRONTEND_KEY'
                    });
                }
                if (apiKey !== config_1.default.security.frontend_api_key) {
                    logger_1.default.warn(`Invalid frontend API key attempt: ${apiKey}`);
                    return res.status(401).json({
                        error: 'Invalid frontend API key',
                        code: 'INVALID_FRONTEND_KEY'
                    });
                }
                next();
            }
            catch (error) {
                logger_1.default.error('Frontend API key check error:', error);
                return res.status(500).json({
                    error: 'API key validation failed',
                    code: 'API_KEY_ERROR'
                });
            }
        };
        // 3. 请求签名验证（更高安全级别）
        this.requestSignature = (req, res, next) => {
            try {
                const signature = req.get('x-request-signature');
                const timestamp = req.get('x-timestamp');
                const nonce = req.get('x-nonce');
                if (!signature || !timestamp || !nonce) {
                    return res.status(401).json({
                        error: 'Request signature required',
                        code: 'MISSING_SIGNATURE'
                    });
                }
                // 检查时间戳（防重放攻击）
                const now = Date.now();
                const requestTime = parseInt(timestamp);
                const timeDiff = Math.abs(now - requestTime);
                if (timeDiff > config_1.default.security.signature_window) {
                    return res.status(401).json({
                        error: 'Request timestamp expired',
                        code: 'TIMESTAMP_EXPIRED'
                    });
                }
                // 生成期望的签名
                const method = req.method;
                const path = req.path;
                const bodyStr = req.method === 'POST' ? JSON.stringify(req.body) : '';
                const signatureData = `${method}|${path}|${bodyStr}|${timestamp}|${nonce}`;
                const expectedSignature = crypto_1.default
                    .createHmac('sha256', config_1.default.security.signature_secret)
                    .update(signatureData)
                    .digest('hex');
                if (signature !== expectedSignature) {
                    logger_1.default.warn(`Invalid request signature. Expected: ${expectedSignature}, Got: ${signature}`);
                    return res.status(401).json({
                        error: 'Invalid request signature',
                        code: 'INVALID_SIGNATURE'
                    });
                }
                next();
            }
            catch (error) {
                logger_1.default.error('Request signature validation error:', error);
                return res.status(500).json({
                    error: 'Signature validation failed',
                    code: 'SIGNATURE_ERROR'
                });
            }
        };
        // 4. 增强的速率限制（基于IP和指纹）
        this.enhancedRateLimit = (req, res, next) => {
            try {
                const ip = req.ip || req.socket.remoteAddress || 'unknown';
                const userAgent = req.get('user-agent') || '';
                const fingerprint = crypto_1.default.createHash('md5').update(`${ip}|${userAgent}`).digest('hex');
                const now = Date.now();
                const windowMs = config_1.default.security.rate_limit_window;
                const maxRequests = config_1.default.security.rate_limit_max;
                // 清理过期记录
                for (const [key, info] of requestCache.entries()) {
                    if (now - info.timestamp > windowMs) {
                        requestCache.delete(key);
                    }
                }
                // 检查当前请求
                const requestInfo = requestCache.get(fingerprint);
                if (!requestInfo) {
                    // 首次请求
                    requestCache.set(fingerprint, {
                        ip,
                        timestamp: now,
                        count: 1
                    });
                    return next();
                }
                // 在时间窗口内
                if (now - requestInfo.timestamp < windowMs) {
                    if (requestInfo.count >= maxRequests) {
                        logger_1.default.warn(`Rate limit exceeded for ${ip}, fingerprint: ${fingerprint}`);
                        return res.status(429).json({
                            error: 'Too many requests',
                            code: 'RATE_LIMIT_EXCEEDED',
                            retryAfter: Math.ceil((windowMs - (now - requestInfo.timestamp)) / 1000)
                        });
                    }
                    requestInfo.count++;
                }
                else {
                    // 新的时间窗口
                    requestInfo.timestamp = now;
                    requestInfo.count = 1;
                }
                next();
            }
            catch (error) {
                logger_1.default.error('Enhanced rate limit error:', error);
                next(); // 不阻止请求，只记录错误
            }
        };
        // 5. User Agent检查
        this.userAgentCheck = (req, res, next) => {
            try {
                const userAgent = req.get('user-agent');
                if (!userAgent) {
                    return res.status(400).json({
                        error: 'User agent required',
                        code: 'MISSING_USER_AGENT'
                    });
                }
                // 检查是否为常见的爬虫或机器人
                const suspiciousPatterns = [
                    /bot/i, /crawler/i, /spider/i, /scraper/i,
                    /curl/i, /wget/i, /python/i, /postman/i
                ];
                const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
                if (isSuspicious && config_1.default.env === 'production') {
                    logger_1.default.warn(`Blocked suspicious user agent: ${userAgent}`);
                    return res.status(403).json({
                        error: 'Access denied: Suspicious user agent',
                        code: 'SUSPICIOUS_USER_AGENT'
                    });
                }
                next();
            }
            catch (error) {
                logger_1.default.error('User agent check error:', error);
                next();
            }
        };
        // 6. 组合保护中间件 - 根据安全级别选择
        this.createProtection = (level = 'standard') => {
            const middlewares = [];
            switch (level) {
                case 'basic':
                    middlewares.push(this.enhancedRateLimit);
                    middlewares.push(this.userAgentCheck);
                    break;
                case 'standard':
                    middlewares.push(this.enhancedRateLimit);
                    middlewares.push(this.originCheck);
                    middlewares.push(this.frontendApiKey);
                    middlewares.push(this.userAgentCheck);
                    break;
                case 'strict':
                    middlewares.push(this.enhancedRateLimit);
                    middlewares.push(this.originCheck);
                    middlewares.push(this.requestSignature);
                    middlewares.push(this.userAgentCheck);
                    break;
            }
            return middlewares;
        };
    }
    // 7. 生成前端签名的辅助函数（可以暴露给前端文档）
    static generateSignature(method, path, body, timestamp, nonce, secret) {
        const signatureData = `${method}|${path}|${body}|${timestamp}|${nonce}`;
        return crypto_1.default
            .createHmac('sha256', secret)
            .update(signatureData)
            .digest('hex');
    }
}
exports.AppProtectionMiddleware = AppProtectionMiddleware;
exports.default = new AppProtectionMiddleware();
