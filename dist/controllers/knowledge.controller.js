"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeController = void 0;
const knowledge_manager_service_1 = require("../services/knowledge-manager.service");
const logger_1 = __importDefault(require("../utils/logger"));
class KnowledgeController {
    constructor() {
        this.knowledgeService = knowledge_manager_service_1.KnowledgeManagerService.getInstance();
    }
    /**
     * 添加企业价值观到知识库
     */
    async addCompanyValues(req, res) {
        try {
            const { companyName, values } = req.body;
            if (!companyName || !values || !Array.isArray(values)) {
                return res.status(400).json({
                    success: false,
                    error: '请提供公司名称和价值观数组'
                });
            }
            // 验证价值观数据结构
            const isValidValues = values.every((value) => value.title && value.description && value.whatIs && value.whyImportant && value.howToDo);
            if (!isValidValues) {
                return res.status(400).json({
                    success: false,
                    error: '价值观数据格式不正确，需要包含：title, description, whatIs, whyImportant, howToDo'
                });
            }
            const ids = await this.knowledgeService.addCompanyValues(companyName, values);
            logger_1.default.info('🎉 企业价值观添加成功', {
                companyName,
                count: values.length,
                ids
            });
            res.json({
                success: true,
                data: {
                    companyName,
                    addedCount: ids.length,
                    ids
                },
                message: `成功添加 ${ids.length} 条企业价值观到知识库`
            });
        }
        catch (error) {
            logger_1.default.error('❌ 添加企业价值观失败', { error: error.message });
            res.status(500).json({
                success: false,
                error: '添加企业价值观失败',
                details: error.message
            });
        }
    }
    /**
     * 搜索知识库
     */
    async searchKnowledge(req, res) {
        try {
            const { query, modelTag, limit } = req.query;
            if (!query) {
                return res.status(400).json({
                    success: false,
                    error: '请提供搜索关键词'
                });
            }
            const results = await this.knowledgeService.searchKnowledge(query, modelTag, parseInt(limit) || 10);
            res.json({
                success: true,
                data: {
                    query,
                    modelTag,
                    results,
                    count: results.length
                }
            });
        }
        catch (error) {
            logger_1.default.error('❌ 搜索知识库失败', { error: error.message });
            res.status(500).json({
                success: false,
                error: '搜索知识库失败',
                details: error.message
            });
        }
    }
    /**
     * 获取指定模型的知识库内容
     */
    async getKnowledgeByModel(req, res) {
        try {
            const { modelTag } = req.params;
            if (!modelTag) {
                return res.status(400).json({
                    success: false,
                    error: '请提供模型标签'
                });
            }
            const knowledge = await this.knowledgeService.getKnowledgeByModel(modelTag);
            res.json({
                success: true,
                data: {
                    modelTag,
                    knowledge,
                    count: knowledge.length
                }
            });
        }
        catch (error) {
            logger_1.default.error('❌ 获取模型知识库失败', { error: error.message });
            res.status(500).json({
                success: false,
                error: '获取模型知识库失败',
                details: error.message
            });
        }
    }
    /**
     * 删除知识条目
     */
    async deleteKnowledgeItem(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: '请提供知识条目ID'
                });
            }
            const success = await this.knowledgeService.deleteKnowledgeItem(id);
            res.json({
                success,
                message: success ? '知识条目删除成功' : '知识条目删除失败'
            });
        }
        catch (error) {
            logger_1.default.error('❌ 删除知识条目失败', { error: error.message });
            res.status(500).json({
                success: false,
                error: '删除知识条目失败',
                details: error.message
            });
        }
    }
    /**
     * 获取知识库统计信息
     */
    async getKnowledgeStats(req, res) {
        try {
            const stats = await this.knowledgeService.getKnowledgeStats();
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            logger_1.default.error('❌ 获取知识库统计失败', { error: error.message });
            res.status(500).json({
                success: false,
                error: '获取知识库统计失败',
                details: error.message
            });
        }
    }
}
exports.KnowledgeController = KnowledgeController;
