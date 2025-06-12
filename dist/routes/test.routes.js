"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supabase_service_1 = require("../services/supabase.service");
const logger_1 = __importDefault(require("../utils/logger"));
const router = express_1.default.Router();
// 测试 Supabase 连接
router.get('/db', async (req, res) => {
    try {
        logger_1.default.info('Testing database connection...');
        // 直接使用 Supabase 服务测试连接
        const supabaseService = supabase_service_1.SupabaseService.getInstance();
        logger_1.default.info('Supabase service instance created');
        // 尝试获取数据
        logger_1.default.info('Attempting to fetch entries from survey_model table...');
        const { data: entries, error } = await supabaseService.getClient()
            .from('survey_model')
            .select('*')
            .limit(5);
        if (error) {
            throw error;
        }
        logger_1.default.info(`Successfully fetched ${entries?.length || 0} entries`);
        res.json({
            status: 'success',
            data: entries || [],
            message: `Database connection successful. Found ${entries?.length || 0} survey models.`
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
// 测试基础分析功能
router.get('/analysis', async (req, res) => {
    try {
        logger_1.default.info('Testing basic analysis functionality...');
        res.json({
            status: 'success',
            message: '基础分析功能可用',
            endpoints: [
                'POST /api/analysis/basic/generate - 生成基础分析',
                'GET /api/analysis/basic/preview/:userId - 预览分析结果',
                'GET /api/analysis/basic/stats - 获取分析统计'
            ]
        });
    }
    catch (error) {
        logger_1.default.error('Analysis test failed:', error);
        res.status(500).json({
            status: 'error',
            message: '分析功能测试失败',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
