"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const factory_1 = require("../services/factory");
const logger_1 = __importDefault(require("../utils/logger"));
const router = express_1.default.Router();
// 测试 Supabase 连接
router.get('/db', async (req, res) => {
    try {
        logger_1.default.info('Testing database connection...');
        // 创建知识库服务实例
        const knowledgeBase = factory_1.ServiceFactory.createKnowledgeBase({
            type: 'supabase',
        });
        logger_1.default.info('Knowledge base service created');
        // 尝试获取数据
        logger_1.default.info('Attempting to fetch entries from survey_model table...');
        const entries = await knowledgeBase.getEntries('survey_model');
        logger_1.default.info(`Successfully fetched ${entries.length} entries`);
        res.json({
            status: 'success',
            data: entries,
        });
    }
    catch (error) {
        logger_1.default.error('Database connection test failed:', error);
        logger_1.default.error('Error details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        res.status(500).json({
            status: 'error',
            message: '数据库连接失败',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
