"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    rate_limit: parseInt(process.env.RATE_LIMIT || '100', 10),
    cors_origin: process.env.CORS_ORIGIN || '*',
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
