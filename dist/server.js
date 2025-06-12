"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const supabase_service_1 = require("./services/supabase.service");
const logger_1 = __importDefault(require("./utils/logger"));
// 加载 .env 文件
(0, dotenv_1.config)();
const port = config_1.default.port;
// 初始化 Supabase 服务
try {
    supabase_service_1.SupabaseService.getInstance();
    logger_1.default.info('Supabase service initialized successfully');
}
catch (error) {
    logger_1.default.error(`Failed to initialize Supabase service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
}
const server = app_1.default.listen(port, () => {
    logger_1.default.info(`Server is running on port ${port} in ${config_1.default.env} environment`);
});
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
exports.default = app_1.default;
