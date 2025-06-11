"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const config_1 = __importDefault(require("../config"));
const router = (0, express_1.Router)();
// 配置检查路由（仅在开发环境可用）
if (config_1.default.env === 'development') {
    router.get('/check', (req, res) => {
        res.json({
            env: config_1.default.env,
            supabase: {
                url: config_1.default.supabase.url ? '已配置' : '未配置',
                key: config_1.default.supabase.key ? '已配置' : '未配置',
                connection_string: config_1.default.supabase.connection_string ? '已配置' : '未配置',
                database: config_1.default.supabase.database ? '已配置' : '未配置',
            },
            openai: {
                api_key: config_1.default.openai.api_key ? '已配置' : '未配置',
                organization_id: config_1.default.openai.organization_id ? '已配置' : '未配置',
            },
        });
    });
}
exports.default = router;
