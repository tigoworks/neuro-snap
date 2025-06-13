"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartRateLimitMiddleware = void 0;
const express_rate_limit_1 = require("express-rate-limit");
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * 智能速率限制中间件
 * 根据接口类型和用途设置不同的限制策略
 */
class SmartRateLimitMiddleware {
    /**
     * 根据接口类型选择合适的限制策略
     */
    static selectLimitByPath(path) {
        // 分析结果查询 - 允许轮询
        if (path.includes('/analysis-result/') || path.includes('/analysis/status/')) {
            return SmartRateLimitMiddleware.queryLimit;
        }
        // AI分析触发 - 严格限制
        if (path.includes('/analysis/analyze') || path.includes('/ai/analyze')) {
            return SmartRateLimitMiddleware.aiAnalysisLimit;
        }
        // 数据提交 - 中等限制
        if (path.includes('/submit') || (path.includes('/api/') && path.match(/POST|PUT|PATCH/))) {
            return SmartRateLimitMiddleware.submitLimit;
        }
        // 健康检查等 - 无限制
        if (path.includes('/health') || path.includes('/status') || path.includes('/ping')) {
            return SmartRateLimitMiddleware.noLimit;
        }
        // 其他接口 - 基础保护
        return SmartRateLimitMiddleware.basicProtection;
    }
}
exports.SmartRateLimitMiddleware = SmartRateLimitMiddleware;
/**
 * 查询类接口限制 - 用于分析结果查询等读取操作
 * 相对宽松，允许轮询
 */
SmartRateLimitMiddleware.queryLimit = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 300, // 每15分钟300次请求 - 支持轮询
    message: {
        error: '查询请求过于频繁，请稍后重试',
        code: 'QUERY_RATE_LIMIT_EXCEEDED',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.default.warn('查询接口速率限制触发', {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            path: req.path,
            method: req.method
        });
        res.status(429).json({
            error: '查询请求过于频繁，请稍后重试',
            code: 'QUERY_RATE_LIMIT_EXCEEDED',
            retryAfter: 60
        });
    }
});
/**
 * 提交类接口限制 - 用于数据提交等写入操作
 * 相对严格，防止恶意提交
 */
SmartRateLimitMiddleware.submitLimit = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 50, // 每15分钟50次提交
    message: {
        error: '提交请求过于频繁，请稍后重试',
        code: 'SUBMIT_RATE_LIMIT_EXCEEDED',
        retryAfter: 300
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.default.warn('提交接口速率限制触发', {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            path: req.path,
            method: req.method
        });
        res.status(429).json({
            error: '提交请求过于频繁，请稍后重试',
            code: 'SUBMIT_RATE_LIMIT_EXCEEDED',
            retryAfter: 300
        });
    }
});
/**
 * AI分析接口限制 - 用于AI分析等计算密集型操作
 * 严格限制，保护AI服务
 */
SmartRateLimitMiddleware.aiAnalysisLimit = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 20, // 每15分钟20次AI分析
    message: {
        error: 'AI分析请求过于频繁，请稍后重试',
        code: 'AI_ANALYSIS_RATE_LIMIT_EXCEEDED',
        retryAfter: 600
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.default.warn('AI分析接口速率限制触发', {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            path: req.path,
            method: req.method
        });
        res.status(429).json({
            error: 'AI分析请求过于频繁，请稍后重试',
            code: 'AI_ANALYSIS_RATE_LIMIT_EXCEEDED',
            retryAfter: 600
        });
    }
});
/**
 * 基础保护限制 - 用于一般接口的基础保护
 * 防止恶意攻击，但不影响正常使用
 */
SmartRateLimitMiddleware.basicProtection = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: config_1.default.security.rate_limit_max, // 使用配置中的值（现在是200）
    message: {
        error: '请求过于频繁，请稍后重试',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.default.warn('基础保护速率限制触发', {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            path: req.path,
            method: req.method
        });
        res.status(429).json({
            error: '请求过于频繁，请稍后重试',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: 60
        });
    }
});
/**
 * 无限制 - 用于不需要限制的接口（如健康检查）
 */
SmartRateLimitMiddleware.noLimit = (req, res, next) => {
    next();
};
exports.default = SmartRateLimitMiddleware;
