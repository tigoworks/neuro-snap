"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseLogger = exports.DatabaseLoggerService = void 0;
exports.LogDatabaseQuery = LogDatabaseQuery;
const logger_1 = __importDefault(require("../utils/logger"));
const crypto_1 = __importDefault(require("crypto"));
class DatabaseLoggerService {
    constructor() { }
    static getInstance() {
        if (!DatabaseLoggerService.instance) {
            DatabaseLoggerService.instance = new DatabaseLoggerService();
        }
        return DatabaseLoggerService.instance;
    }
    // 生成查询ID
    generateQueryId() {
        return crypto_1.default.randomBytes(6).toString('hex');
    }
    // 记录查询开始
    logQueryStart(options) {
        const queryId = this.generateQueryId();
        logger_1.default.info('🗄️  Database Query Started', {
            queryId,
            timestamp: new Date().toISOString(),
            table: options.table,
            operation: options.operation,
            select: options.select,
            filters: this.sanitizeFilters(options.filters),
            data: this.sanitizeData(options.data),
            inputParams: options.inputParams ? this.sanitizeData(options.inputParams) : undefined,
        });
        return queryId;
    }
    // 记录查询成功
    logQuerySuccess(queryId, result, startTime, options) {
        const duration = Date.now() - startTime;
        const resultCount = this.getResultCount(result);
        logger_1.default.info('✅ Database Query Success', {
            queryId,
            table: options.table,
            operation: options.operation,
            duration: `${duration}ms`,
            resultCount,
            resultSize: this.getResultSize(result),
            inputParams: options.inputParams ? this.sanitizeData(options.inputParams) : undefined,
        });
        // 在开发环境下记录查询结果样本和入参详情
        if (process.env.NODE_ENV === 'development' && result) {
            logger_1.default.debug('📊 Query Result Sample', {
                queryId,
                sample: this.getSampleResult(result),
                inputDetails: options.inputParams ? {
                    filters: this.sanitizeFilters(options.filters),
                    data: this.sanitizeData(options.data),
                    inputParams: this.sanitizeData(options.inputParams)
                } : undefined,
            });
        }
    }
    // 记录查询失败
    logQueryError(queryId, error, startTime, options) {
        const duration = Date.now() - startTime;
        logger_1.default.error('❌ Database Query Failed', {
            queryId,
            table: options.table,
            operation: options.operation,
            duration: `${duration}ms`,
            error: {
                name: error?.name || 'Unknown',
                message: error?.message || String(error),
                code: error?.code,
                details: error?.details,
                hint: error?.hint,
            },
            inputParams: options.inputParams ? this.sanitizeData(options.inputParams) : undefined,
            queryDetails: {
                filters: this.sanitizeFilters(options.filters),
                data: this.sanitizeData(options.data),
                select: options.select
            }
        });
    }
    // 记录事务操作
    logTransaction(operation, transactionId) {
        const txId = transactionId || this.generateQueryId();
        logger_1.default.info('💾 Database Transaction', {
            transactionId: txId,
            operation,
            timestamp: new Date().toISOString(),
        });
        return txId;
    }
    // 脱敏过滤条件
    sanitizeFilters(filters) {
        if (!filters || typeof filters !== 'object') {
            return filters;
        }
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'phone', 'email'];
        const sanitized = {};
        for (const [key, value] of Object.entries(filters)) {
            const lowerKey = key.toLowerCase();
            if (sensitiveFields.some(field => lowerKey.includes(field))) {
                sanitized[key] = '[REDACTED]';
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    // 脱敏数据
    sanitizeData(data) {
        if (!data || typeof data !== 'object') {
            return data;
        }
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'phone', 'email'];
        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeData(item));
        }
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            const lowerKey = key.toLowerCase();
            if (sensitiveFields.some(field => lowerKey.includes(field))) {
                sanitized[key] = '[REDACTED]';
            }
            else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeData(value);
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    // 获取结果数量
    getResultCount(result) {
        if (!result)
            return 0;
        if (Array.isArray(result))
            return result.length;
        if (result.data && Array.isArray(result.data))
            return result.data.length;
        if (result.data)
            return 1;
        return 1;
    }
    // 获取结果大小（字节）
    getResultSize(result) {
        if (!result)
            return 0;
        try {
            return Buffer.byteLength(JSON.stringify(result), 'utf8');
        }
        catch {
            return 0;
        }
    }
    // 获取结果样本（用于调试）
    getSampleResult(result) {
        if (!result)
            return null;
        try {
            if (Array.isArray(result)) {
                return {
                    count: result.length,
                    first: result[0] ? this.sanitizeData(result[0]) : null,
                    structure: result[0] ? Object.keys(result[0]) : []
                };
            }
            if (result.data && Array.isArray(result.data)) {
                return {
                    count: result.data.length,
                    first: result.data[0] ? this.sanitizeData(result.data[0]) : null,
                    structure: result.data[0] ? Object.keys(result.data[0]) : []
                };
            }
            if (result.data) {
                return {
                    count: 1,
                    data: this.sanitizeData(result.data),
                    structure: Object.keys(result.data)
                };
            }
            return this.sanitizeData(result);
        }
        catch (error) {
            return '[SAMPLE_ERROR]';
        }
    }
}
exports.DatabaseLoggerService = DatabaseLoggerService;
// 数据库查询装饰器
function LogDatabaseQuery(options = {}) {
    return function (target, propertyName, descriptor) {
        const originalMethod = descriptor.value;
        const dbLogger = DatabaseLoggerService.getInstance();
        descriptor.value = async function (...args) {
            const startTime = Date.now();
            const queryId = dbLogger.logQueryStart({
                table: options.table,
                operation: options.operation || propertyName,
                filters: args[0], // 通常第一个参数是过滤条件
                data: args[1], // 通常第二个参数是数据
                select: options.select,
            });
            try {
                const result = await originalMethod.apply(this, args);
                dbLogger.logQuerySuccess(queryId, result, startTime, {
                    table: options.table,
                    operation: options.operation || propertyName,
                });
                return result;
            }
            catch (error) {
                dbLogger.logQueryError(queryId, error, startTime, {
                    table: options.table,
                    operation: options.operation || propertyName,
                });
                throw error;
            }
        };
        return descriptor;
    };
}
// 导出单例实例
exports.databaseLogger = DatabaseLoggerService.getInstance();
