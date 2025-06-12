"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeManagerService = void 0;
const supabase_service_1 = require("./supabase.service");
const logger_1 = __importDefault(require("../utils/logger"));
class KnowledgeManagerService {
    constructor() {
        this.supabase = supabase_service_1.SupabaseService.getInstance();
    }
    static getInstance() {
        if (!KnowledgeManagerService.instance) {
            KnowledgeManagerService.instance = new KnowledgeManagerService();
        }
        return KnowledgeManagerService.instance;
    }
    /**
     * 添加知识条目到知识库
     */
    async addKnowledgeItem(item) {
        try {
            logger_1.default.info('📚 添加知识条目到知识库', { title: item.title, model_tag: item.model_tag });
            const { data, error } = await this.supabase.getClient()
                .from('knowledge_base')
                .insert({
                title: item.title,
                content: item.content,
                model_tag: item.model_tag,
                source_type: item.source_type,
                created_at: new Date().toISOString()
            })
                .select('id')
                .single();
            if (error) {
                logger_1.default.error('❌ 添加知识条目失败', { error: error.message });
                throw error;
            }
            logger_1.default.info('✅ 知识条目添加成功', { id: data.id, title: item.title });
            return data.id;
        }
        catch (error) {
            logger_1.default.error('❌ 知识库操作异常', { error: error.message });
            throw error;
        }
    }
    /**
     * 批量添加企业价值观
     */
    async addCompanyValues(companyName, values) {
        try {
            logger_1.default.info('🏢 批量添加企业价值观', {
                company: companyName,
                count: values.length
            });
            const knowledgeItems = values.map(value => ({
                title: `${companyName} - ${value.title}`,
                content: this.formatValueContent(value),
                model_tag: 'company_values',
                source_type: 'company_values',
                category: 'corporate_culture',
                tags: ['价值观', '企业文化', companyName, value.title],
                metadata: {
                    company: companyName,
                    valueType: value.title,
                    structure: {
                        whatIs: value.whatIs,
                        whyImportant: value.whyImportant,
                        howToDo: value.howToDo
                    }
                }
            }));
            const insertPromises = knowledgeItems.map(item => this.addKnowledgeItem(item));
            const ids = await Promise.all(insertPromises);
            logger_1.default.info('✅ 企业价值观批量添加完成', {
                company: companyName,
                addedCount: ids.length,
                ids: ids
            });
            return ids;
        }
        catch (error) {
            logger_1.default.error('❌ 批量添加企业价值观失败', {
                company: companyName,
                error: error.message
            });
            throw error;
        }
    }
    /**
     * 格式化价值观内容
     */
    formatValueContent(value) {
        return `# ${value.title}

## 价值观描述
${value.description}

## 是什么
${value.whatIs}

## 为什么重要
${value.whyImportant}

## 怎么做
${value.howToDo}

---
*此内容为企业价值观知识库条目，用于AI分析时提供文化背景参考*`;
    }
    /**
     * 搜索知识库内容
     */
    async searchKnowledge(query, modelTag, limit = 10) {
        try {
            logger_1.default.info('🔍 搜索知识库', { query, modelTag, limit });
            let queryBuilder = this.supabase.getClient()
                .from('knowledge_base')
                .select('*')
                .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
                .limit(limit);
            if (modelTag) {
                queryBuilder = queryBuilder.eq('model_tag', modelTag);
            }
            const { data, error } = await queryBuilder;
            if (error) {
                logger_1.default.error('❌ 知识库搜索失败', { error: error.message });
                throw error;
            }
            logger_1.default.info('✅ 知识库搜索完成', {
                query,
                resultCount: data?.length || 0
            });
            return data || [];
        }
        catch (error) {
            logger_1.default.error('❌ 知识库搜索异常', { error: error.message });
            throw error;
        }
    }
    /**
     * 获取指定模型的所有知识条目
     */
    async getKnowledgeByModel(modelTag) {
        try {
            logger_1.default.info('📖 获取模型知识库', { modelTag });
            const { data, error } = await this.supabase.getClient()
                .from('knowledge_base')
                .select('*')
                .eq('model_tag', modelTag)
                .order('created_at', { ascending: false });
            if (error) {
                logger_1.default.error('❌ 获取模型知识库失败', { error: error.message });
                throw error;
            }
            logger_1.default.info('✅ 模型知识库获取完成', {
                modelTag,
                count: data?.length || 0
            });
            return data || [];
        }
        catch (error) {
            logger_1.default.error('❌ 获取模型知识库异常', { error: error.message });
            throw error;
        }
    }
    /**
     * 删除知识条目
     */
    async deleteKnowledgeItem(id) {
        try {
            logger_1.default.info('🗑️ 删除知识条目', { id });
            const { error } = await this.supabase.getClient()
                .from('knowledge_base')
                .delete()
                .eq('id', id);
            if (error) {
                logger_1.default.error('❌ 删除知识条目失败', { error: error.message });
                throw error;
            }
            logger_1.default.info('✅ 知识条目删除成功', { id });
            return true;
        }
        catch (error) {
            logger_1.default.error('❌ 删除知识条目异常', { error: error.message });
            throw error;
        }
    }
    /**
     * 获取知识库统计信息
     */
    async getKnowledgeStats() {
        try {
            logger_1.default.info('📊 获取知识库统计');
            const { data, error } = await this.supabase.getClient()
                .from('knowledge_base')
                .select('model_tag, source_type');
            if (error) {
                logger_1.default.error('❌ 获取知识库统计失败', { error: error.message });
                throw error;
            }
            const stats = {
                totalItems: data?.length || 0,
                byModelTag: {},
                bySourceType: {}
            };
            data?.forEach(item => {
                // 按模型标签统计
                stats.byModelTag[item.model_tag] = (stats.byModelTag[item.model_tag] || 0) + 1;
                // 按来源类型统计
                stats.bySourceType[item.source_type] = (stats.bySourceType[item.source_type] || 0) + 1;
            });
            logger_1.default.info('✅ 知识库统计完成', stats);
            return stats;
        }
        catch (error) {
            logger_1.default.error('❌ 获取知识库统计异常', { error: error.message });
            throw error;
        }
    }
}
exports.KnowledgeManagerService = KnowledgeManagerService;
