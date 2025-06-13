"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const config_1 = __importDefault(require("../config"));
// 自定义控制台格式化函数
const consoleFormat = winston_1.default.format.printf(({ level, message, timestamp, ...meta }) => {
    // 时间格式化
    const time = new Date(timestamp).toLocaleTimeString('zh-CN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Shanghai'
    });
    // 级别颜色
    const levelColors = {
        error: '\x1b[31m', // 红色
        warn: '\x1b[33m', // 黄色
        info: '\x1b[36m', // 青色
        debug: '\x1b[90m', // 灰色
    };
    const reset = '\x1b[0m';
    const levelColor = levelColors[level] || '\x1b[37m';
    const coloredLevel = `${levelColor}${level.toUpperCase().padEnd(5)}${reset}`;
    // 消息颜色（根据emoji）
    const messageStr = String(message);
    let coloredMessage = messageStr;
    if (messageStr.includes('🚀'))
        coloredMessage = `\x1b[32m${messageStr}${reset}`; // 绿色
    else if (messageStr.includes('✅'))
        coloredMessage = `\x1b[32m${messageStr}${reset}`; // 绿色
    else if (messageStr.includes('❌'))
        coloredMessage = `\x1b[31m${messageStr}${reset}`; // 红色
    else if (messageStr.includes('🗄️'))
        coloredMessage = `\x1b[36m${messageStr}${reset}`; // 青色
    else if (messageStr.includes('📊'))
        coloredMessage = `\x1b[35m${messageStr}${reset}`; // 紫色
    else if (messageStr.includes('💾'))
        coloredMessage = `\x1b[33m${messageStr}${reset}`; // 黄色
    else if (messageStr.includes('📤'))
        coloredMessage = `\x1b[34m${messageStr}${reset}`; // 蓝色
    // 基础日志行
    let logLine = `\x1b[90m${time}${reset} ${coloredLevel} ${coloredMessage}`;
    // 添加关键信息
    const details = [];
    if (meta.requestId) {
        details.push(`\x1b[90mreq:${meta.requestId.slice(-8)}${reset}`);
    }
    if (meta.queryId) {
        details.push(`\x1b[90mquery:${meta.queryId}${reset}`);
    }
    if (meta.transactionId) {
        details.push(`\x1b[90mtx:${meta.transactionId.slice(-8)}${reset}`);
    }
    if (meta.method && meta.url) {
        const statusColor = (meta.statusCode && meta.statusCode >= 400) ? '\x1b[31m' :
            (meta.statusCode && meta.statusCode >= 300) ? '\x1b[33m' : '\x1b[32m';
        const status = meta.statusCode ? `${statusColor}${meta.statusCode}${reset}` : '';
        details.push(`\x1b[96m${meta.method}${reset} \x1b[94m${meta.url}${reset} ${status}`);
    }
    if (meta.table && meta.operation) {
        details.push(`\x1b[95m${meta.operation}${reset} \x1b[93m${meta.table}${reset}`);
    }
    if (meta.duration) {
        const durationMs = parseInt(meta.duration);
        const durationColor = durationMs > 1000 ? '\x1b[31m' :
            durationMs > 500 ? '\x1b[33m' : '\x1b[32m';
        details.push(`${durationColor}${meta.duration}${reset}`);
    }
    if (meta.resultCount !== undefined) {
        details.push(`\x1b[96m${meta.resultCount} rows${reset}`);
    }
    if (details.length > 0) {
        logLine += ` \x1b[90m[${reset}${details.join(' \x1b[90m|${reset} ')}\x1b[90m]${reset}`;
    }
    // 错误信息
    if (meta.error) {
        logLine += `\n    \x1b[31mError: ${meta.error.message}${reset}`;
        if (meta.error.code) {
            logLine += ` \x1b[90m(${meta.error.code})${reset}`;
        }
    }
    // 详细信息（仅在debug级别显示）
    if (level === 'debug' && Object.keys(meta).length > 0) {
        const filteredMeta = { ...meta };
        delete filteredMeta.requestId;
        delete filteredMeta.queryId;
        delete filteredMeta.transactionId;
        delete filteredMeta.method;
        delete filteredMeta.url;
        delete filteredMeta.statusCode;
        delete filteredMeta.table;
        delete filteredMeta.operation;
        delete filteredMeta.duration;
        delete filteredMeta.resultCount;
        delete filteredMeta.error;
        if (Object.keys(filteredMeta).length > 0) {
            logLine += `\n    \x1b[90m${JSON.stringify(filteredMeta, null, 2)}${reset}`;
        }
    }
    return logLine;
});
const logger = winston_1.default.createLogger({
    level: config_1.default.env === 'production' ? 'info' : 'debug',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    defaultMeta: { service: 'neuro-snap-backend' },
    transports: [
        new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston_1.default.transports.File({ filename: 'logs/combined.log' }),
    ],
});
if (config_1.default.env !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), consoleFormat)
    }));
}
exports.default = logger;
