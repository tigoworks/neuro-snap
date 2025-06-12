"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisController = void 0;
const database_logger_service_1 = require("../services/database-logger.service");
const openai_analysis_service_1 = require("../services/openai-analysis.service");
const mcp_knowledge_service_1 = require("../services/mcp-knowledge.service");
class AnalysisController {
    constructor() {
        this.logger = database_logger_service_1.DatabaseLoggerService.getInstance();
        this.analysisService = new openai_analysis_service_1.OpenAIAnalysisService();
        this.knowledgeService = new mcp_knowledge_service_1.MCPKnowledgeService();
    }
    /**
     * 生成AI分析报告
     */
    async generateAnalysis(req, res) {
        const requestId = req.headers['x-request-id'] || `analysis_${Date.now()}`;
        try {
            console.log('🤖 收到AI分析请求:', requestId);
            // 验证请求数据
            if (!req.body.userId || !req.body.userAnswers) {
                res.status(400).json({
                    error: '缺少必需参数：userId 和 userAnswers',
                    code: 'MISSING_PARAMS'
                });
                return;
            }
            // 构建分析请求
            const analysisRequest = {
                userId: req.body.userId,
                userAnswers: req.body.userAnswers,
                analysisType: req.body.analysisType || 'comprehensive',
                includeRecommendations: req.body.includeRecommendations !== false,
                language: req.body.language || 'zh'
            };
            console.log('📝 分析请求详情:', {
                userId: analysisRequest.userId,
                analysisType: analysisRequest.analysisType,
                testCount: Object.keys(analysisRequest.userAnswers).length,
                language: analysisRequest.language
            });
            // 执行AI分析
            const analysisResult = await this.analysisService.performAnalysis(analysisRequest);
            console.log('✅ AI分析完成:', {
                analysisId: analysisResult.id,
                confidence: analysisResult.confidence,
                processingTime: `${analysisResult.processingTime}ms`,
                knowledgeSourcesUsed: analysisResult.knowledgeSourcesUsed.length
            });
            // 返回结果
            res.json({
                success: true,
                data: {
                    analysisId: analysisResult.id,
                    report: analysisResult.report,
                    metadata: {
                        confidence: analysisResult.confidence,
                        processingTime: analysisResult.processingTime,
                        knowledgeSourcesUsed: analysisResult.knowledgeSourcesUsed.length,
                        analysisType: analysisResult.analysisType,
                        createdAt: analysisResult.createdAt
                    }
                }
            });
        }
        catch (error) {
            console.error('❌ AI分析失败:', error);
            res.status(500).json({
                error: '分析生成失败',
                details: error.message,
                code: 'ANALYSIS_FAILED'
            });
        }
    }
    /**
     * 获取分析报告
     */
    async getAnalysis(req, res) {
        try {
            const { analysisId } = req.params;
            if (!analysisId) {
                res.status(400).json({
                    error: '缺少分析ID',
                    code: 'MISSING_ANALYSIS_ID'
                });
                return;
            }
            // 这里应该从数据库获取分析结果
            // 暂时返回示例数据
            res.json({
                success: true,
                data: {
                    message: '分析报告获取功能正在开发中',
                    analysisId: analysisId
                }
            });
        }
        catch (error) {
            console.error('获取分析失败:', error);
            res.status(500).json({
                error: '获取分析失败',
                details: error.message
            });
        }
    }
    /**
     * 获取用户的分析历史
     */
    async getAnalysisHistory(req, res) {
        try {
            const { userId } = req.params;
            if (!userId) {
                res.status(400).json({
                    error: '缺少用户ID',
                    code: 'MISSING_USER_ID'
                });
                return;
            }
            const history = await this.analysisService.getAnalysisHistory(userId);
            res.json({
                success: true,
                data: {
                    history,
                    count: history.length
                }
            });
        }
        catch (error) {
            console.error('获取分析历史失败:', error);
            res.status(500).json({
                error: '获取分析历史失败',
                details: error.message
            });
        }
    }
    /**
     * 删除分析记录
     */
    async deleteAnalysis(req, res) {
        try {
            const { analysisId } = req.params;
            if (!analysisId) {
                res.status(400).json({
                    error: '缺少分析ID',
                    code: 'MISSING_ANALYSIS_ID'
                });
                return;
            }
            const deleted = await this.analysisService.deleteAnalysis(analysisId);
            if (deleted) {
                res.json({
                    success: true,
                    message: '分析记录删除成功'
                });
            }
            else {
                res.status(404).json({
                    error: '分析记录不存在',
                    code: 'ANALYSIS_NOT_FOUND'
                });
            }
        }
        catch (error) {
            console.error('删除分析失败:', error);
            res.status(500).json({
                error: '删除分析失败',
                details: error.message
            });
        }
    }
    /**
     * 获取知识库统计信息
     */
    async getKnowledgeStats(req, res) {
        try {
            const stats = await this.knowledgeService.getStatistics();
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            console.error('获取知识库统计失败:', error);
            res.status(500).json({
                error: '获取知识库统计失败',
                details: error.message
            });
        }
    }
    /**
     * 搜索知识库
     */
    async searchKnowledge(req, res) {
        try {
            const { query, category, tags, limit } = req.query;
            if (!query) {
                res.status(400).json({
                    error: '缺少搜索关键词',
                    code: 'MISSING_QUERY'
                });
                return;
            }
            const searchQuery = {
                query: query,
                category: category,
                tags: tags ? tags.split(',') : undefined,
                limit: limit ? parseInt(limit) : 10
            };
            const results = await this.knowledgeService.search(searchQuery);
            res.json({
                success: true,
                data: {
                    results,
                    count: results.length,
                    query: searchQuery
                }
            });
        }
        catch (error) {
            console.error('搜索知识库失败:', error);
            res.status(500).json({
                error: '搜索知识库失败',
                details: error.message
            });
        }
    }
    /**
     * 导入文件到知识库
     */
    async importFile(req, res) {
        try {
            const { filePath, category, tags } = req.body;
            if (!filePath) {
                res.status(400).json({
                    error: '缺少文件路径',
                    code: 'MISSING_FILE_PATH'
                });
                return;
            }
            const entryId = await this.knowledgeService.importFile(filePath, category || 'general', tags || []);
            res.json({
                success: true,
                data: {
                    entryId,
                    message: '文件导入成功'
                }
            });
        }
        catch (error) {
            console.error('文件导入失败:', error);
            res.status(500).json({
                error: '文件导入失败',
                details: error.message
            });
        }
    }
    /**
     * 从URL导入内容到知识库
     */
    async importFromUrl(req, res) {
        try {
            const { url, category, tags } = req.body;
            if (!url) {
                res.status(400).json({
                    error: '缺少URL地址',
                    code: 'MISSING_URL'
                });
                return;
            }
            const entryId = await this.knowledgeService.importFromUrl(url, category || 'web', tags || []);
            res.json({
                success: true,
                data: {
                    entryId,
                    message: '网页内容导入成功'
                }
            });
        }
        catch (error) {
            console.error('网页导入失败:', error);
            res.status(500).json({
                error: '网页导入失败',
                details: error.message
            });
        }
    }
    /**
     * 预览分析结果（不保存到数据库）
     */
    async previewAnalysis(req, res) {
        try {
            const { userAnswers, analysisType, language } = req.body;
            if (!userAnswers) {
                res.status(400).json({
                    error: '缺少用户答案数据',
                    code: 'MISSING_USER_ANSWERS'
                });
                return;
            }
            // 构建预览请求（不保存到数据库）
            const analysisRequest = {
                userId: 'preview-user',
                userAnswers,
                analysisType: analysisType || 'comprehensive',
                includeRecommendations: true,
                language: language || 'zh'
            };
            const analysisResult = await this.analysisService.performAnalysis(analysisRequest);
            res.json({
                success: true,
                data: {
                    report: analysisResult.report,
                    metadata: {
                        confidence: analysisResult.confidence,
                        processingTime: analysisResult.processingTime,
                        knowledgeSourcesUsed: analysisResult.knowledgeSourcesUsed.length,
                        isPreview: true
                    }
                }
            });
        }
        catch (error) {
            console.error('预览分析失败:', error);
            res.status(500).json({
                error: '预览分析失败',
                details: error.message
            });
        }
    }
}
exports.AnalysisController = AnalysisController;
