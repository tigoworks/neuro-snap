"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// 加载环境变量，优先读取 .env 文件
dotenv_1.default.config(); // 加载默认的 .env 文件
const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '8080', 10), // 默认端口改为8080
    rate_limit: parseInt(process.env.RATE_LIMIT || '100', 10),
    cors_origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'],
    auth: {
        jwt_secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
        api_key: process.env.API_KEY || 'your-api-key-change-in-production',
        token_expiry: parseInt(process.env.TOKEN_EXPIRY || '86400', 10), // 24小时
    },
    security: {
        allowed_origins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'https://your-frontend-domain.com'],
        frontend_api_key: process.env.FRONTEND_API_KEY || 'your-frontend-app-key-change-in-production',
        signature_secret: process.env.SIGNATURE_SECRET || 'your-signature-secret-change-in-production',
        signature_window: parseInt(process.env.SIGNATURE_WINDOW || '300000', 10), // 5分钟
        rate_limit_window: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15分钟
        rate_limit_max: parseInt(process.env.RATE_LIMIT_MAX || '200', 10), // 每15分钟200次请求（大幅提高）
    },
    supabase: {
        url: process.env.SUPABASE_URL || '',
        key: process.env.SUPABASE_KEY || '',
        connection_string: process.env.SUPABASE_CONNECTION_STRING || '',
        database: process.env.SUPABASE_DATABASE || '',
    },
    openai: {
        api_key: process.env.OPENAI_API_KEY || '',
        organization_id: process.env.OPENAI_ORGANIZATION_ID,
    },
    ai_service: {
        model: process.env.AI_MODEL || 'gpt-3.5-turbo',
        temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
        max_tokens: parseInt(process.env.AI_MAX_TOKENS || '1000', 10),
        retry_count: parseInt(process.env.AI_RETRY_COUNT || '3', 10),
        retry_delay: parseInt(process.env.AI_RETRY_DELAY || '1000', 10),
    },
};
exports.default = config;
