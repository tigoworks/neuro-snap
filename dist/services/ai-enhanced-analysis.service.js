"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIEnhancedAnalysisService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const openai_1 = __importDefault(require("openai"));
const socks_proxy_agent_1 = require("socks-proxy-agent");
const logger_1 = __importDefault(require("../utils/logger"));
const knowledge_manager_service_1 = require("./knowledge-manager.service");
const supabase_service_1 = require("./supabase.service");
const auto_analysis_service_1 = require("./auto-analysis.service");
const database_logger_service_1 = require("./database-logger.service");
class AIEnhancedAnalysisService {
    constructor() {
        this.openai = null;
        this.knowledgeService = knowledge_manager_service_1.KnowledgeManagerService.getInstance();
        this.supabaseService = supabase_service_1.SupabaseService.getInstance();
        this.fallbackService = new auto_analysis_service_1.AutoAnalysisService();
        this.config = {
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
            maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4000'),
            timeout: parseInt(process.env.AI_TIMEOUT || '60000')
        };
        // 初始化OpenAI客户端
        this.initializeOpenAI();
    }
    /**
     * 初始化OpenAI客户端
     */
    initializeOpenAI() {
        const apiKey = process.env.OPENAI_API_KEY;
        const baseURL = process.env.OPENAI_BASE_URL;
        const proxyUrl = process.env.OPENAI_PROXY;
        if (!apiKey) {
            logger_1.default.warn('⚠️  OpenAI API密钥未配置，将使用规则分析作为降级方案');
            return;
        }
        try {
            const openaiConfig = {
                apiKey,
                baseURL: baseURL || 'https://api.openai.com/v1',
                timeout: this.config.timeout
            };
            // 如果配置了代理，使用SOCKS5代理
            if (proxyUrl) {
                logger_1.default.info('🔧 使用SOCKS5代理配置OpenAI客户端', { proxyUrl });
                const agent = new socks_proxy_agent_1.SocksProxyAgent(proxyUrl);
                openaiConfig.httpAgent = agent;
                openaiConfig.httpsAgent = agent;
            }
            this.openai = new openai_1.default(openaiConfig);
            logger_1.default.info('✅ OpenAI客户端初始化成功', {
                model: this.config.model,
                baseURL: baseURL || 'https://api.openai.com/v1',
                proxy: proxyUrl || 'direct'
            });
        }
        catch (error) {
            logger_1.default.error('❌ OpenAI客户端初始化失败', { error });
            this.openai = null;
        }
    }
    /**
     * AI增强的分析入口
     */
    async triggerAnalysisAfterSubmission(request) {
        const startTime = Date.now();
        const analysisId = this.generateAnalysisId();
        logger_1.default.info('🤖 开始AI增强分析', {
            analysisId,
            userId: request.userId,
            userName: request.userInfo?.name,
            testTypes: Object.keys(request.answers).filter(key => request.answers[key]),
            aiEnabled: !!this.openai
        });
        try {
            // 1. 获取相关知识库内容
            const knowledgeBase = await this.getRelevantKnowledge(request.answers);
            // 2. 尝试AI分析，失败时降级到规则分析
            let analysisResult;
            if (this.openai) {
                try {
                    analysisResult = await this.performAIAnalysis(request, knowledgeBase);
                    logger_1.default.info('✅ AI分析成功', { analysisId, userId: request.userId });
                }
                catch (aiError) {
                    logger_1.default.warn('⚠️  AI分析失败，降级到规则分析', {
                        analysisId,
                        userId: request.userId,
                        error: aiError instanceof Error ? aiError.message : String(aiError)
                    });
                    analysisResult = await this.performRuleBasedAnalysis(request, knowledgeBase);
                }
            }
            else {
                logger_1.default.info('📋 使用规则分析（AI未配置）', { analysisId, userId: request.userId });
                analysisResult = await this.performRuleBasedAnalysis(request, knowledgeBase);
            }
            // 3. 保存分析结果到数据库
            const savedResult = await this.saveAnalysisResult(analysisId, request.userId, analysisResult, startTime);
            logger_1.default.info('✅ AI增强分析完成', {
                analysisId,
                userId: request.userId,
                processingTime: `${Date.now() - startTime}ms`,
                confidenceScore: savedResult.confidence_score,
                knowledgeSourcesUsed: savedResult.knowledge_sources.length,
                analysisMethod: this.openai ? 'AI' : 'Rule-based'
            });
            return savedResult;
        }
        catch (error) {
            logger_1.default.error('❌ AI增强分析失败', {
                analysisId,
                userId: request.userId,
                error: {
                    name: error instanceof Error ? error.name : 'Unknown',
                    message: error instanceof Error ? error.message : String(error)
                },
                processingTime: `${Date.now() - startTime}ms`
            });
            throw error;
        }
    }
    /**
     * 执行AI分析
     */
    async performAIAnalysis(request, knowledgeBase) {
        if (!this.openai) {
            throw new Error('OpenAI客户端未初始化');
        }
        const { userInfo, answers } = request;
        // 构建智能prompt
        const prompt = await this.buildIntelligentPrompt(userInfo, answers, knowledgeBase);
        // 记录发送给AI的完整prompt
        logger_1.default.info('📝 发送给AI的完整Prompt:', {
            promptLength: prompt.length,
            promptPreview: prompt.substring(0, 500) + '...',
            fullPrompt: prompt // 完整prompt内容
        });
        logger_1.default.info('🧠 调用OpenAI API', {
            model: this.config.model,
            temperature: this.config.temperature,
            maxTokens: this.config.maxTokens,
            promptLength: prompt.length
        });
        try {
            const completion = await this.openai.chat.completions.create({
                model: this.config.model,
                messages: [
                    {
                        role: 'system',
                        content: this.getSystemPrompt()
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens,
                response_format: { type: 'json_object' }
            });
            const aiResponse = completion.choices[0]?.message?.content;
            // 记录AI返回的原始结果
            logger_1.default.info('🤖 AI返回的原始结果:', {
                responseLength: aiResponse?.length || 0,
                responsePreview: aiResponse?.substring(0, 500) + '...',
                fullResponse: aiResponse, // 完整AI响应
                usage: completion.usage
            });
            if (!aiResponse) {
                throw new Error('AI未返回有效响应');
            }
            // 解析AI响应
            const aiAnalysis = JSON.parse(aiResponse);
            // 验证和增强AI分析结果
            const enhancedAnalysis = this.enhanceAIAnalysis(aiAnalysis, answers, knowledgeBase);
            logger_1.default.info('✅ OpenAI分析完成', {
                tokensUsed: completion.usage?.total_tokens,
                finishReason: completion.choices[0]?.finish_reason
            });
            return enhancedAnalysis;
        }
        catch (error) {
            logger_1.default.error('❌ OpenAI API调用失败', { error });
            throw error;
        }
    }
    /**
     * 构建智能prompt
     */
    async buildIntelligentPrompt(userInfo, answers, knowledgeBase) {
        // 用户基本信息
        const userProfile = `
用户基本信息：
- 姓名：${userInfo.name || '未提供'}
- 年龄：${userInfo.age || '未提供'}
- 性别：${userInfo.gender || '未提供'}
- 城市：${userInfo.city || '未提供'}
- 职业：${userInfo.occupation || '未提供'}
- 教育背景：${userInfo.education || '未提供'}
`;
        // 测试答案
        const testAnswers = await this.formatTestAnswers(answers);
        // 知识库内容
        const knowledgeContent = this.formatKnowledgeBase(knowledgeBase);
        // 分析要求
        const analysisRequirements = `
请基于以上信息进行综合分析，并以JSON格式返回结果，包含以下字段：

{
  "summary": "简要总结（200字以内）",
  "detailed_analysis": {
    "personalProfile": {
      "basicInfo": "基本信息分析",
      "demographics": "人口统计学特征",
      "careerStage": "职业发展阶段"
    },
    "testResults": {
      "personality": "人格特征分析",
      "careerDevelopment": "职业发展倾向",
      "behaviorStyle": "行为风格",
      "interests": "兴趣偏好",
      "values": "价值观取向"
    },
    "growthCycle": {
      "currentStage": "当前成长阶段（探索期/建立期/发展期/成熟期/转型期）",
      "stageCharacteristics": "当前阶段的特征和挑战",
      "nextStagePreview": "下一阶段的预期发展",
      "cycleDuration": "预计当前阶段持续时间",
      "transitionSignals": "进入下一阶段的信号（数组格式）",
      "stageSpecificGoals": "当前阶段应重点关注的目标（数组格式）"
    },
    "futureAchievements": {
      "shortTermPotential": {
        "timeframe": "1-2年内",
        "achievableGoals": "可实现的成就（数组格式）",
        "keyMilestones": "关键里程碑（数组格式）",
        "successProbability": "成功概率（0-100）"
      },
      "mediumTermPotential": {
        "timeframe": "3-5年内", 
        "achievableGoals": "可实现的成就（数组格式）",
        "keyMilestones": "关键里程碑（数组格式）",
        "successProbability": "成功概率（0-100）"
      },
      "longTermPotential": {
        "timeframe": "5-10年内",
        "achievableGoals": "可实现的成就（数组格式）",
        "keyMilestones": "关键里程碑（数组格式）",
        "successProbability": "成功概率（0-100）"
      },
      "peakPotential": {
        "timeframe": "职业生涯巅峰期",
        "ultimateAchievements": "最高成就潜力（数组格式）",
        "legacyImpact": "可能的影响力和贡献",
        "realizationFactors": "实现巅峰的关键因素（数组格式）"
      }
    },
    "developmentPathway": {
      "criticalSkills": "需要重点发展的技能（数组格式）",
      "learningPriorities": "学习优先级排序（数组格式）",
      "experienceGaps": "需要补充的经验（数组格式）",
      "mentorshipNeeds": "导师指导需求",
      "networkingStrategy": "人脉建设策略",
      "riskFactors": "可能阻碍发展的风险因素（数组格式）",
      "mitigationStrategies": "风险缓解策略（数组格式）"
    },
    "careerRecommendations": "职业建议（数组格式）",
    "developmentSuggestions": "发展建议（数组格式）",
    "culturalFit": {
      "matchingValues": "匹配的企业价值观",
      "fitScore": "文化匹配度（0-100）",
      "developmentAreas": "需要发展的领域"
    },
    "strengthsAndWeaknesses": {
      "strengths": "优势特质（数组格式）",
      "weaknesses": "待发展领域（数组格式）",
      "actionPlan": "行动计划（数组格式）"
    }
  },
  "recommendations": "具体建议（数组格式，5-7条）",
  "confidence_score": "分析置信度（0-100的数字）"
}

分析要求：
1. 深度结合用户的测试答案和专业知识库
2. 提供个性化、具体、可操作的建议
3. 考虑用户的职业发展阶段和背景
4. 结合企业文化价值观进行匹配分析
5. 基于心理学理论预测成长周期和发展轨迹
6. 提供具体的时间框架和可量化的成就目标
7. 识别关键的发展节点和转折机会
8. 确保分析的专业性和准确性
`;
        return `${userProfile}\n${testAnswers}\n${knowledgeContent}\n${analysisRequirements}`;
    }
    /**
     * 格式化测试答案 - 查询题目内容和选项文本
     */
    async formatTestAnswers(answers) {
        let formatted = '\n测试答案：\n';
        try {
            // 获取所有题目信息
            const { data: questionsData, error } = await this.supabaseService.getClient()
                .from('survey_question')
                .select('*');
            if (error) {
                logger_1.default.error('查询题目信息失败', { error });
                return formatted + '无法获取题目信息\n';
            }
            // 创建题目映射
            const questionMap = new Map();
            questionsData?.forEach(q => {
                questionMap.set(q.question_code, q);
            });
            // 处理五问法测试
            if (answers.fiveQuestions) {
                formatted += '\n=== 五问法测试 ===\n';
                for (const [questionCode, answer] of Object.entries(answers.fiveQuestions)) {
                    const question = questionMap.get(questionCode);
                    if (question) {
                        formatted += `\n问题：${question.content}\n`;
                        if (question.type === 'text') {
                            formatted += `回答：${answer}\n`;
                        }
                        else if (question.type === 'single' && question.options) {
                            const selectedOption = question.options.find((opt) => opt.code.toString() === answer);
                            formatted += `选择：${selectedOption ? selectedOption.label : answer}\n`;
                        }
                    }
                }
            }
            // 处理MBTI测试
            if (answers.mbti) {
                formatted += '\n=== MBTI人格测试 ===\n';
                for (const [questionCode, answer] of Object.entries(answers.mbti)) {
                    const question = questionMap.get(questionCode);
                    if (question) {
                        formatted += `\n问题：${question.content}\n`;
                        if (question.options) {
                            const selectedOption = question.options.find((opt) => opt.code.toString() === answer);
                            formatted += `选择：${selectedOption ? selectedOption.label : answer}\n`;
                        }
                    }
                }
            }
            // 处理大五人格测试
            if (answers.bigFive) {
                formatted += '\n=== 大五人格测试 ===\n';
                for (const [questionCode, answer] of Object.entries(answers.bigFive)) {
                    const question = questionMap.get(questionCode);
                    if (question) {
                        formatted += `\n问题：${question.content}\n`;
                        formatted += `评分：${answer}/5\n`;
                    }
                }
            }
            // 处理DISC测试
            if (answers.disc) {
                formatted += '\n=== DISC行为风格测试 ===\n';
                for (const [questionCode, answer] of Object.entries(answers.disc)) {
                    const question = questionMap.get(questionCode);
                    if (question) {
                        formatted += `\n问题：${question.content}\n`;
                        if (question.options) {
                            const selectedOption = question.options.find((opt) => opt.code.toString() === answer);
                            formatted += `选择：${selectedOption ? selectedOption.label : answer}\n`;
                        }
                    }
                }
            }
            // 处理霍兰德测试
            if (answers.holland) {
                formatted += '\n=== 霍兰德职业兴趣测试 ===\n';
                for (const [questionCode, answer] of Object.entries(answers.holland)) {
                    const question = questionMap.get(questionCode);
                    if (question) {
                        formatted += `\n问题：${question.content}\n`;
                        formatted += `评分：${answer}/5\n`;
                    }
                }
            }
            // 处理价值观测试
            if (answers.values) {
                formatted += '\n=== 价值观测试 ===\n';
                for (const [questionCode, answer] of Object.entries(answers.values)) {
                    const question = questionMap.get(questionCode);
                    if (question) {
                        formatted += `\n问题：${question.content}\n`;
                        if (question.type === 'text') {
                            formatted += `回答：${answer}\n`;
                        }
                        else if (question.type === 'single' && question.options) {
                            const selectedOption = question.options.find((opt) => opt.code.toString() === answer);
                            formatted += `选择：${selectedOption ? selectedOption.label : answer}\n`;
                        }
                        else if (question.type === 'multiple' && Array.isArray(answer) && question.options) {
                            const selectedOptions = answer.map(code => {
                                const option = question.options.find((opt) => opt.code.toString() === code);
                                return option ? option.label : code;
                            });
                            formatted += `选择：${selectedOptions.join('、')}\n`;
                        }
                        else if (question.type === 'sorting' && question.options) {
                            if (typeof answer === 'object' && answer && 'order' in answer && Array.isArray(answer.order)) {
                                const sortedOptions = answer.order.map((code) => {
                                    const option = question.options.find((opt) => opt.code === code);
                                    return option ? option.label : code;
                                });
                                formatted += `排序：${sortedOptions.join(' > ')}\n`;
                            }
                        }
                    }
                }
            }
        }
        catch (error) {
            logger_1.default.error('格式化测试答案失败', { error });
            formatted += '格式化答案时发生错误\n';
        }
        return formatted;
    }
    /**
     * 格式化知识库内容
     */
    formatKnowledgeBase(knowledgeBase) {
        if (!knowledgeBase.length) {
            return '\n知识库：暂无相关知识库内容\n';
        }
        let formatted = '\n专业知识库：\n';
        knowledgeBase.forEach((item, index) => {
            formatted += `\n${index + 1}. ${item.title || `知识条目${index + 1}`}\n`;
            formatted += `内容：${item.content}\n`;
            if (item.model_tag) {
                formatted += `适用模型：${item.model_tag}\n`;
            }
            formatted += '---\n';
        });
        return formatted;
    }
    /**
     * 获取系统prompt
     */
    getSystemPrompt() {
        return `你是一位资深的心理学专家和职业规划顾问，拥有丰富的人格测评和职业发展指导经验。

你的专业能力包括：
1. 深度理解各种心理测评工具（MBTI、大五人格、DISC、霍兰德等）
2. 精通职业发展理论和实践（Super的生涯发展理论、Schein的职业锚理论等）
3. 擅长个性化分析和建议制定
4. 了解企业文化和组织行为
5. 精通成长周期理论和人才发展规律
6. 具备前瞻性思维和趋势预测能力

请基于提供的用户信息、测试答案和专业知识库，进行深入、准确、个性化的分析。

特别关注以下分析维度：

**成长周期分析**：
- 基于Super的生涯发展阶段理论（成长期、探索期、建立期、维持期、衰退期）
- 结合Levinson的成人发展理论识别当前生命阶段
- 分析个体的心理发展成熟度和职业发展阶段的匹配度
- 预测下一发展阶段的时间节点和转换信号

**未来成就预测**：
- 基于个体的人格特质、能力倾向和价值观预测发展潜力
- 运用多元智能理论分析优势智能领域的成就可能性
- 结合行业趋势和社会发展预测未来机会窗口
- 提供不同时间维度的具体成就目标和实现路径

**发展路径规划**：
- 识别关键能力发展节点和技能获取时机
- 分析潜在风险因素和应对策略
- 提供个性化的学习和经验积累建议
- 规划人脉建设和导师关系发展策略

分析原则：
- 科学严谨：基于心理学理论和实证研究
- 前瞻性：结合行业趋势和未来发展预测
- 个性化：充分考虑用户的具体情况和背景
- 实用性：提供具体可操作的建议和时间表
- 全面性：涵盖人格、职业、发展等多个维度
- 专业性：使用专业术语但保持易懂
- 激励性：给予用户信心和明确的发展方向

请确保返回的JSON格式正确，所有字段都有合理的内容，特别是成长周期和未来成就预测部分要具体、可量化。`;
    }
    /**
     * 增强AI分析结果
     */
    enhanceAIAnalysis(aiAnalysis, answers, knowledgeBase) {
        // 确保必要字段存在
        const enhanced = {
            summary: aiAnalysis.summary || '基于AI分析生成的个性化报告',
            detailed_analysis: aiAnalysis.detailed_analysis || {},
            recommendations: Array.isArray(aiAnalysis.recommendations) ? aiAnalysis.recommendations : [],
            confidence_score: typeof aiAnalysis.confidence_score === 'number' ? aiAnalysis.confidence_score : 85,
            knowledge_sources: knowledgeBase.map(item => item.title || item.id),
            analysis_method: 'AI-powered',
            model_used: this.config.model
        };
        // 如果AI分析缺少某些字段，用规则补充
        if (!enhanced.recommendations.length) {
            enhanced.recommendations = this.generateFallbackRecommendations(answers);
        }
        return enhanced;
    }
    /**
     * 执行规则分析（降级方案）
     */
    async performRuleBasedAnalysis(request, knowledgeBase) {
        // 使用现有的规则分析服务
        const ruleAnalysis = await this.fallbackService.triggerAnalysisAfterSubmission(request);
        // 标记为规则分析
        return {
            ...ruleAnalysis,
            analysis_method: 'Rule-based',
            ai_fallback: true
        };
    }
    /**
     * 获取相关知识库内容
     */
    async getRelevantKnowledge(answers) {
        const queryId = database_logger_service_1.databaseLogger.logQueryStart({
            table: 'knowledge_base',
            operation: 'SELECT',
            filters: { model_tag: 'multiple' }
        });
        try {
            const knowledgeItems = [];
            // 根据测试类型获取相关知识
            const testTypes = Object.keys(answers).filter(key => answers[key]);
            for (const testType of testTypes) {
                const modelTag = this.mapTestTypeToModelTag(testType);
                const items = await this.knowledgeService.getKnowledgeByModel(modelTag);
                knowledgeItems.push(...items);
            }
            // 获取成长周期相关知识
            const growthCycleItems = await this.knowledgeService.getKnowledgeByModel('growth_cycle');
            knowledgeItems.push(...growthCycleItems);
            // 获取未来成就预测相关知识
            const futureAchievementItems = await this.knowledgeService.getKnowledgeByModel('future_achievements');
            knowledgeItems.push(...futureAchievementItems);
            // 获取发展路径规划相关知识
            const developmentPathwayItems = await this.knowledgeService.getKnowledgeByModel('development_pathway');
            knowledgeItems.push(...developmentPathwayItems);
            // 获取通用企业文化知识
            const cultureItems = await this.knowledgeService.searchKnowledge('企业文化 价值观', '10');
            knowledgeItems.push(...cultureItems);
            database_logger_service_1.databaseLogger.logQuerySuccess(queryId, knowledgeItems, Date.now(), {
                table: 'knowledge_base',
                operation: 'SELECT'
            });
            return knowledgeItems;
        }
        catch (error) {
            database_logger_service_1.databaseLogger.logQueryError(queryId, error, Date.now(), {
                table: 'knowledge_base',
                operation: 'SELECT'
            });
            throw error;
        }
    }
    /**
     * 保存分析结果
     */
    async saveAnalysisResult(analysisId, userId, analysisResult, startTime) {
        const queryId = database_logger_service_1.databaseLogger.logQueryStart({
            table: 'analysis_results',
            operation: 'INSERT',
            filters: { user_id: userId }
        });
        try {
            const processingTime = Date.now() - startTime;
            const result = {
                id: analysisId,
                user_id: userId,
                analysis_type: 'comprehensive',
                summary: analysisResult.summary,
                detailed_analysis: analysisResult.detailed_analysis,
                recommendations: analysisResult.recommendations,
                confidence_score: analysisResult.confidence_score,
                knowledge_sources: analysisResult.knowledge_sources,
                created_at: new Date().toISOString(),
                processing_time_ms: processingTime
            };
            const { data, error } = await this.supabaseService.getClient()
                .from('analysis_results')
                .insert({
                id: analysisId,
                user_id: userId,
                model_code: analysisResult.analysis_method || 'AI-enhanced',
                result_summary: analysisResult.summary,
                result_json: {
                    detailed_analysis: analysisResult.detailed_analysis,
                    recommendations: analysisResult.recommendations,
                    confidence_score: analysisResult.confidence_score,
                    knowledge_sources: analysisResult.knowledge_sources,
                    processing_time_ms: processingTime,
                    analysis_method: analysisResult.analysis_method,
                    model_used: analysisResult.model_used
                },
                completed_at: new Date().toISOString()
            })
                .select()
                .single();
            if (error)
                throw error;
            database_logger_service_1.databaseLogger.logQuerySuccess(queryId, [data], Date.now(), {
                table: 'analysis_results',
                operation: 'INSERT'
            });
            return result;
        }
        catch (error) {
            database_logger_service_1.databaseLogger.logQueryError(queryId, error, Date.now(), {
                table: 'analysis_results',
                operation: 'INSERT'
            });
            throw error;
        }
    }
    /**
     * 生成降级推荐
     */
    generateFallbackRecommendations(answers) {
        const recommendations = [];
        if (answers.fiveQuestions) {
            recommendations.push('基于五问法分析，建议关注职业发展规划');
        }
        if (answers.mbti) {
            recommendations.push('根据MBTI结果，建议发挥个性优势');
        }
        if (answers.bigFive) {
            recommendations.push('基于大五人格特征，建议平衡各维度发展');
        }
        recommendations.push('建议定期进行自我反思和能力提升');
        recommendations.push('建议寻求专业的职业发展指导');
        return recommendations;
    }
    /**
     * 生成分析ID
     */
    generateAnalysisId() {
        return crypto_1.default.randomUUID();
    }
    /**
     * 映射测试类型到模型标签
     */
    mapTestTypeToModelTag(testType) {
        const mapping = {
            'fiveQuestions': 'career_development',
            'mbti': 'mbti',
            'bigFive': 'big5',
            'disc': 'disc',
            'holland': 'holland',
            'values': 'values'
        };
        return mapping[testType] || 'general';
    }
    /**
     * 检查AI服务状态
     */
    async getAIStatus() {
        if (!this.openai) {
            return {
                available: false,
                model: 'N/A',
                provider: 'OpenAI',
                message: 'OpenAI API密钥未配置'
            };
        }
        try {
            // 使用Promise.race实现快速超时检查
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('健康检查超时')), 5000); // 5秒超时
            });
            const statusPromise = this.openai.models.list();
            // 等待API调用或超时
            await Promise.race([statusPromise, timeoutPromise]);
            return {
                available: true,
                model: this.config.model,
                provider: 'OpenAI'
            };
        }
        catch (error) {
            logger_1.default.warn('⚠️  OpenAI API健康检查失败', {
                error: error instanceof Error ? error.message : String(error)
            });
            return {
                available: false,
                model: this.config.model,
                provider: 'OpenAI',
                message: error instanceof Error ? error.message : 'API连接失败'
            };
        }
    }
}
exports.AIEnhancedAnalysisService = AIEnhancedAnalysisService;
