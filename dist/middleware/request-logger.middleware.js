"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = exports.RequestLoggerMiddleware = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const crypto_1 = __importDefault(require("crypto"));
class RequestLoggerMiddleware {
    constructor() {
        // 主要的请求日志中间件
        this.logRequest = (req, res, next) => {
            const requestId = this.generateRequestId();
            const startTime = Date.now();
            // 添加请求ID到请求对象
            req.requestId = requestId;
            req.startTime = startTime;
            // 获取客户端信息
            const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
            const userAgent = req.get('User-Agent') || 'unknown';
            const referer = req.get('Referer') || '';
            const origin = req.get('Origin') || '';
            // 记录请求开始
            logger_1.default.info('🚀 API Request Started', {
                requestId,
                timestamp: new Date().toISOString(),
                method: req.method,
                url: req.originalUrl,
                path: req.path,
                query: req.query,
                headers: {
                    'content-type': req.get('Content-Type'),
                    'user-agent': userAgent,
                    'origin': origin,
                    'referer': referer,
                    'x-forwarded-for': req.get('X-Forwarded-For'),
                    'x-frontend-key': req.get('X-Frontend-Key') ? '[PRESENT]' : '[MISSING]',
                },
                clientInfo: {
                    ip: clientIp,
                    userAgent,
                },
                // 记录请求体（敏感信息脱敏）
                body: this.sanitizeBody(req.body),
            });
            // 拦截响应
            const originalSend = res.send;
            const originalJson = res.json;
            const self = this;
            res.send = function (body) {
                const endTime = Date.now();
                const duration = endTime - startTime;
                logger_1.default.info('✅ API Request Completed', {
                    requestId,
                    method: req.method,
                    url: req.originalUrl,
                    statusCode: res.statusCode,
                    statusMessage: res.statusMessage,
                    duration: `${duration}ms`,
                    responseSize: Buffer.byteLength(body || '', 'utf8'),
                    headers: {
                        'content-type': res.get('Content-Type'),
                    }
                });
                // 记录响应体（仅在开发环境或出错时）
                if (process.env.NODE_ENV === 'development' || res.statusCode >= 400) {
                    logger_1.default.info('📤 Response Body', {
                        requestId,
                        statusCode: res.statusCode,
                        body: self.sanitizeResponseBody(body),
                    });
                }
                return originalSend.call(this, body);
            };
            res.json = function (obj) {
                const endTime = Date.now();
                const duration = endTime - startTime;
                logger_1.default.info('✅ API Request Completed (JSON)', {
                    requestId,
                    method: req.method,
                    url: req.originalUrl,
                    statusCode: res.statusCode,
                    statusMessage: res.statusMessage,
                    duration: `${duration}ms`,
                    responseSize: Buffer.byteLength(JSON.stringify(obj || {}), 'utf8'),
                });
                // 记录响应体（仅在开发环境或出错时）
                if (process.env.NODE_ENV === 'development' || res.statusCode >= 400) {
                    logger_1.default.info('📤 Response Body (JSON)', {
                        requestId,
                        statusCode: res.statusCode,
                        body: self.sanitizeResponseBody(obj),
                    });
                }
                return originalJson.call(this, obj);
            };
            next();
        };
        // 错误日志中间件
        this.logError = (err, req, res, next) => {
            const requestId = req.requestId || 'unknown';
            const duration = req.startTime ? Date.now() - req.startTime : 0;
            logger_1.default.error('❌ API Request Error', {
                requestId,
                method: req.method,
                url: req.originalUrl,
                error: {
                    name: err.name,
                    message: err.message,
                    stack: err.stack,
                },
                duration: `${duration}ms`,
                clientInfo: {
                    ip: req.ip || req.socket.remoteAddress,
                    userAgent: req.get('User-Agent'),
                }
            });
            next(err);
        };
    }
    // 生成请求ID
    generateRequestId() {
        return crypto_1.default.randomBytes(8).toString('hex');
    }
    // 脱敏请求体中的敏感信息
    sanitizeBody(body) {
        if (!body || typeof body !== 'object') {
            return body;
        }
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'phone', 'email'];
        const sanitized = { ...body };
        const sanitizeObject = (obj) => {
            if (Array.isArray(obj)) {
                return obj.map(item => sanitizeObject(item));
            }
            if (obj && typeof obj === 'object') {
                const result = {};
                for (const [key, value] of Object.entries(obj)) {
                    const lowerKey = key.toLowerCase();
                    if (sensitiveFields.some(field => lowerKey.includes(field))) {
                        result[key] = '[REDACTED]';
                    }
                    else {
                        result[key] = sanitizeObject(value);
                    }
                }
                return result;
            }
            return obj;
        };
        return sanitizeObject(sanitized);
    }
    // 脱敏响应体中的敏感信息
    sanitizeResponseBody(body) {
        if (!body)
            return body;
        try {
            let parsedBody = body;
            if (typeof body === 'string') {
                try {
                    parsedBody = JSON.parse(body);
                }
                catch {
                    return '[NON-JSON RESPONSE]';
                }
            }
            // 如果响应体太大，只记录结构
            const bodyStr = JSON.stringify(parsedBody);
            if (bodyStr.length > 10000) {
                return {
                    message: '[LARGE_RESPONSE_TRUNCATED]',
                    size: bodyStr.length,
                    keys: Object.keys(parsedBody || {})
                };
            }
            return this.sanitizeBody(parsedBody);
        }
        catch (error) {
            return '[RESPONSE_PARSE_ERROR]';
        }
    }
    // 数据库查询日志装饰器
    static logDatabaseQuery(operation, table) {
        return function (target, propertyName, descriptor) {
            const method = descriptor.value;
            descriptor.value = async function (...args) {
                const startTime = Date.now();
                const queryId = crypto_1.default.randomBytes(4).toString('hex');
                logger_1.default.info('🗄️  Database Query Started', {
                    queryId,
                    operation,
                    table,
                    method: `${target.constructor.name}.${propertyName}`,
                    timestamp: new Date().toISOString(),
                });
                try {
                    const result = await method.apply(this, args);
                    const duration = Date.now() - startTime;
                    logger_1.default.info('✅ Database Query Completed', {
                        queryId,
                        operation,
                        table,
                        duration: `${duration}ms`,
                        resultCount: Array.isArray(result) ? result.length : (result ? 1 : 0),
                    });
                    return result;
                }
                catch (error) {
                    const duration = Date.now() - startTime;
                    logger_1.default.error('❌ Database Query Failed', {
                        queryId,
                        operation,
                        table,
                        duration: `${duration}ms`,
                        error: {
                            name: error instanceof Error ? error.name : 'Unknown',
                            message: error instanceof Error ? error.message : String(error),
                        }
                    });
                    throw error;
                }
            };
        };
    }
}
exports.RequestLoggerMiddleware = RequestLoggerMiddleware;
// 导出单例
exports.requestLogger = new RequestLoggerMiddleware();
