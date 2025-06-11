"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const express_1 = __importDefault(require("express"));
const config_1 = __importDefault(require("./config"));
const supabase_service_1 = require("./services/supabase.service");
const logger_1 = __importDefault(require("./utils/logger"));
// 加载 .env.local 文件
(0, dotenv_1.config)({ path: '.env.local' });
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    logger_1.default.info(`Server is running on port ${port} in ${config_1.default.env} environment`);
});
// 初始化 Supabase 服务
try {
    supabase_service_1.SupabaseService.getInstance();
    logger_1.default.info('Supabase service initialized successfully');
}
catch (error) {
    logger_1.default.error(`Failed to initialize Supabase service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
}
// 中间件
app.use(express_1.default.json());
// 路由
app.use('/api/test', require('./routes/test.routes').default);
app.use('/api/survey', require('./routes/survey.routes').default);
app.use('/api/user', require('./routes/user.routes').default);
// Graceful shutdown
process.on('SIGTERM', () => {
    logger_1.default.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger_1.default.info('HTTP server closed');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    logger_1.default.info('SIGINT signal received: closing HTTP server');
    server.close(() => {
        logger_1.default.info('HTTP server closed');
        process.exit(0);
    });
});
exports.default = app;
