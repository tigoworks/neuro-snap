"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
// import analysisRoutes from './routes/analysis.routes';
const simple_analysis_routes_1 = __importDefault(require("./routes/simple-analysis.routes"));
const analysis_result_routes_1 = __importDefault(require("./routes/analysis-result.routes"));
const ai_status_routes_1 = __importDefault(require("./routes/ai-status.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const survey_routes_1 = __importDefault(require("./routes/survey.routes"));
const answer_routes_1 = __importDefault(require("./routes/answer.routes"));
const config_routes_1 = __importDefault(require("./routes/config.routes"));
const test_routes_1 = __importDefault(require("./routes/test.routes"));
const api_routes_1 = __importDefault(require("./routes/api.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const knowledge_routes_1 = __importDefault(require("./routes/knowledge.routes"));
const error_middleware_1 = __importDefault(require("./middleware/error.middleware"));
const request_logger_middleware_1 = require("./middleware/request-logger.middleware");
const config_1 = __importDefault(require("./config"));
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: config_1.default.cors_origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Frontend-Key',
        'X-Requested-With',
        'Accept',
        'Origin'
    ],
    credentials: true
}));
// Body parsing middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// 添加压缩中间件
app.use((0, compression_1.default)());
// Enhanced request logging middleware
app.use(request_logger_middleware_1.requestLogger.logRequest);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config_1.default.env,
        version: '1.0.0'
    });
});
// Routes
// Authentication routes
app.use('/api/auth', auth_routes_1.default);
// Frontend-compatible API routes (priority)
app.use('/api', api_routes_1.default);
// Original backend routes (for backward compatibility)
// app.use('/api/analyze', analysisRoutes);  // 暂时注释掉有问题的AI分析路由
app.use('/api/analysis', simple_analysis_routes_1.default); // 新的基础分析系统
app.use('/api/analysis-result', analysis_result_routes_1.default); // 分析结果查询系统
app.use('/api/ai', ai_status_routes_1.default); // AI服务状态检查
app.use('/api/knowledge', knowledge_routes_1.default); // 知识库管理系统
app.use('/api/user', user_routes_1.default);
app.use('/api/survey', survey_routes_1.default);
app.use('/api/answer', answer_routes_1.default);
app.use('/api/config', config_routes_1.default);
app.use('/api/test', test_routes_1.default);
// Error handling
app.use(error_middleware_1.default.notFoundHandler);
app.use(request_logger_middleware_1.requestLogger.logError); // 错误日志记录
app.use(error_middleware_1.default.errorHandler);
exports.default = app;
