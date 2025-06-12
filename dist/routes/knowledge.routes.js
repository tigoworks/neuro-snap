"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const knowledge_controller_1 = require("../controllers/knowledge.controller");
const auth_middleware_1 = __importDefault(require("../middleware/auth.middleware"));
const router = (0, express_1.Router)();
const knowledgeController = new knowledge_controller_1.KnowledgeController();
// 应用认证中间件到所有知识库路由
router.use(auth_middleware_1.default.optionalAuth);
/**
 * @route POST /api/knowledge/company-values
 * @desc 添加企业价值观到知识库
 * @body {
 *   companyName: string,
 *   values: Array<{
 *     title: string,
 *     description: string,
 *     whatIs: string,
 *     whyImportant: string,
 *     howToDo: string
 *   }>
 * }
 */
router.post('/company-values', knowledgeController.addCompanyValues.bind(knowledgeController));
/**
 * @route GET /api/knowledge/search
 * @desc 搜索知识库内容
 * @query {
 *   query: string (required),
 *   modelTag?: string,
 *   limit?: number
 * }
 */
router.get('/search', knowledgeController.searchKnowledge.bind(knowledgeController));
/**
 * @route GET /api/knowledge/model/:modelTag
 * @desc 获取指定模型的知识库内容
 * @param modelTag - 模型标签 (如: company_values, mbti, big5, etc.)
 */
router.get('/model/:modelTag', knowledgeController.getKnowledgeByModel.bind(knowledgeController));
/**
 * @route DELETE /api/knowledge/item/:id
 * @desc 删除知识条目
 * @param id - 知识条目ID
 */
router.delete('/item/:id', knowledgeController.deleteKnowledgeItem.bind(knowledgeController));
/**
 * @route GET /api/knowledge/stats
 * @desc 获取知识库统计信息
 */
router.get('/stats', knowledgeController.getKnowledgeStats.bind(knowledgeController));
exports.default = router;
