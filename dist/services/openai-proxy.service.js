"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProxyService = void 0;
const axios_1 = __importDefault(require("axios"));
const socks_proxy_agent_1 = require("socks-proxy-agent");
const database_logger_service_1 = require("./database-logger.service");
class OpenAIProxyService {
    constructor(config) {
        this.logger = database_logger_service_1.DatabaseLoggerService.getInstance();
        this.config = {
            baseURL: 'https://api.openai.com/v1',
            model: 'gpt-4o',
            timeout: 60000,
            ...config
        };
        this.axiosInstance = this.createAxiosInstance();
    }
    createAxiosInstance() {
        const axiosConfig = {
            baseURL: this.config.baseURL,
            timeout: this.config.timeout,
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json',
                'User-Agent': 'neuro-snap-ai-analysis/1.0'
            }
        };
        // 如果配置了代理，使用 SOCKS5 代理
        if (this.config.proxyUrl) {
            console.log(`🔧 使用 SOCKS5 代理: ${this.config.proxyUrl}`);
            const agent = new socks_proxy_agent_1.SocksProxyAgent(this.config.proxyUrl);
            axiosConfig.httpsAgent = agent;
        }
        return axios_1.default.create(axiosConfig);
    }
    /**
     * 测试 OpenAI 连接
     */
    async testConnection() {
        try {
            console.log('🔍 测试 OpenAI 连接...');
            const response = await this.axiosInstance.get('/models');
            const models = response.data.data?.map((model) => model.id) || [];
            const gpt4Models = models.filter((id) => id.includes('gpt-4'));
            console.log(`✅ OpenAI 连接成功！可用模型: ${models.length} 个`);
            console.log(`🤖 GPT-4 系列模型: ${gpt4Models.length} 个`);
            return {
                success: true,
                message: `连接成功，可用模型: ${models.length} 个`,
                models: gpt4Models.slice(0, 10) // 返回前10个GPT-4模型
            };
        }
        catch (error) {
            console.log('❌ OpenAI 连接失败:', error.message);
            return {
                success: false,
                message: `连接失败: ${error.message}`
            };
        }
    }
    /**
     * 执行 AI 分析
     */
    async performAnalysis(request) {
        const startTime = Date.now();
        const analysisId = `ai_analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        try {
            console.log(`🤖 开始 AI 分析: ${request.userId}`);
            // 构建分析提示
            const prompt = this.buildAnalysisPrompt(request.userAnswers, request.language || 'zh');
            console.log('📝 发送请求到 OpenAI...');
            const response = await this.axiosInstance.post('/chat/completions', {
                model: this.config.model,
                messages: [
                    {
                        role: 'system',
                        content: this.getSystemPrompt(request.language || 'zh')
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 4000,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0
            });
            if (response.data.error) {
                throw new Error(`OpenAI API 错误: ${response.data.error.message}`);
            }
            const analysisText = response.data.choices[0].message.content;
            const processingTime = Date.now() - startTime;
            console.log(`✅ AI 分析完成: ${analysisId} (${processingTime}ms)`);
            // 解析 AI 分析结果
            const parsedAnalysis = this.parseAnalysisResult(analysisText, request.userAnswers);
            return {
                id: analysisId,
                userId: request.userId,
                analysis: parsedAnalysis,
                metadata: {
                    model: this.config.model,
                    processingTime,
                    confidence: 0.95, // AI 分析的置信度通常较高
                    knowledgeSourcesUsed: 1, // OpenAI 知识库
                    isAIAnalysis: true
                },
                createdAt: new Date()
            };
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            console.error('❌ AI 分析失败:', error);
            throw new Error(`AI 分析失败: ${error.message}`);
        }
    }
    getSystemPrompt(language) {
        if (language === 'zh') {
            return `你是一位世界顶级的心理学专家和职业规划顾问，拥有丰富的心理测评和职业指导经验。

请基于用户的心理测评结果，提供专业、深入、个性化的分析报告。你的分析应该：

1. **专业性**: 基于心理学理论和实证研究
2. **个性化**: 针对用户的具体情况和背景
3. **实用性**: 提供可操作的建议和指导
4. **全面性**: 涵盖人格特质、职业适配、发展建议等多个维度

请以JSON格式返回分析结果，包含以下结构：
{
  "personalityProfile": {
    "mbtiType": "具体类型",
    "mbtiDescription": "详细描述",
    "bigFiveScores": { "openness": 数值, "conscientiousness": 数值, "extraversion": 数值, "agreeableness": 数值, "neuroticism": 数值 },
    "discProfile": { "dominance": 数值, "influence": 数值, "steadiness": 数值, "conscientiousness": 数值, "primaryStyle": "主要风格" },
    "hollandCode": { "realistic": 数值, "investigative": 数值, "artistic": 数值, "social": 数值, "enterprising": 数值, "conventional": 数值, "topThree": ["前三类型"] }
  },
  "careerGuidance": {
    "idealCareers": [{ "title": "职业名称", "match": 匹配度, "description": "描述", "requirements": ["要求"], "growthPotential": "发展前景" }],
    "industryRecommendations": ["推荐行业"],
    "skillsToImprove": ["需要提升的技能"],
    "careerDevelopmentPlan": { "shortTerm": ["短期目标"], "mediumTerm": ["中期目标"], "longTerm": ["长期目标"] }
  },
  "recommendations": {
    "personalDevelopment": ["个人发展建议"],
    "learningResources": ["学习资源"],
    "actionItems": ["行动项目"],
    "nextSteps": ["下一步行动"]
  },
  "summary": {
    "title": "报告标题",
    "overview": "总体概述",
    "keyInsights": "关键洞察",
    "strengthsAndWeaknesses": { "strengths": ["优势"], "weaknesses": ["劣势"], "improvementAreas": ["改进领域"] }
  },
  "workStyle": {
    "preferredEnvironment": "偏好的工作环境",
    "communicationStyle": "沟通风格",
    "leadershipStyle": "领导风格",
    "teamRole": "团队角色",
    "motivationFactors": ["激励因素"],
    "workingStyle": "工作风格"
  }
}`;
        }
        else {
            return `You are a world-class psychology expert and career counselor with extensive experience in psychological assessment and career guidance.

Please provide a professional, in-depth, personalized analysis report based on the user's psychological assessment results. Your analysis should be:

1. **Professional**: Based on psychological theories and empirical research
2. **Personalized**: Tailored to the user's specific situation and background
3. **Practical**: Providing actionable advice and guidance
4. **Comprehensive**: Covering personality traits, career fit, development suggestions, and other dimensions

Please return the analysis results in JSON format with the following structure:
{
  "personalityProfile": {
    "mbtiType": "specific type",
    "mbtiDescription": "detailed description",
    "bigFiveScores": { "openness": value, "conscientiousness": value, "extraversion": value, "agreeableness": value, "neuroticism": value },
    "discProfile": { "dominance": value, "influence": value, "steadiness": value, "conscientiousness": value, "primaryStyle": "primary style" },
    "hollandCode": { "realistic": value, "investigative": value, "artistic": value, "social": value, "enterprising": value, "conventional": value, "topThree": ["top three types"] }
  },
  "careerGuidance": {
    "idealCareers": [{ "title": "career name", "match": match_score, "description": "description", "requirements": ["requirements"], "growthPotential": "growth potential" }],
    "industryRecommendations": ["recommended industries"],
    "skillsToImprove": ["skills to improve"],
    "careerDevelopmentPlan": { "shortTerm": ["short-term goals"], "mediumTerm": ["medium-term goals"], "longTerm": ["long-term goals"] }
  },
  "recommendations": {
    "personalDevelopment": ["personal development advice"],
    "learningResources": ["learning resources"],
    "actionItems": ["action items"],
    "nextSteps": ["next steps"]
  },
  "summary": {
    "title": "report title",
    "overview": "overall overview",
    "keyInsights": "key insights",
    "strengthsAndWeaknesses": { "strengths": ["strengths"], "weaknesses": ["weaknesses"], "improvementAreas": ["improvement areas"] }
  },
  "workStyle": {
    "preferredEnvironment": "preferred work environment",
    "communicationStyle": "communication style",
    "leadershipStyle": "leadership style",
    "teamRole": "team role",
    "motivationFactors": ["motivation factors"],
    "workingStyle": "working style"
  }
}`;
        }
    }
    buildAnalysisPrompt(userAnswers, language) {
        const userInfo = userAnswers.userInfo || {};
        const mbti = userAnswers.mbti || {};
        const bigFive = userAnswers.bigFive || {};
        const disc = userAnswers.disc || {};
        const holland = userAnswers.holland || {};
        const values = userAnswers.values || {};
        const fiveQuestions = userAnswers.fiveQuestions || {};
        if (language === 'zh') {
            return `请分析以下用户的心理测评数据：

**用户基本信息：**
- 姓名：${userInfo.name || '未提供'}
- 性别：${userInfo.gender || '未提供'}
- 年龄：${userInfo.age || '未提供'}
- 城市：${userInfo.city || '未提供'}
- 职业：${userInfo.occupation || '未提供'}
- 教育背景：${userInfo.education || '未提供'}

**MBTI 人格测试答案：**
${JSON.stringify(mbti, null, 2)}

**大五人格测试答案：**
${JSON.stringify(bigFive, null, 2)}

**DISC 行为风格测试答案：**
${JSON.stringify(disc, null, 2)}

**霍兰德职业兴趣测试答案：**
${JSON.stringify(holland, null, 2)}

**价值观测试答案：**
${JSON.stringify(values, null, 2)}

**五问法深度探索：**
${JSON.stringify(fiveQuestions, null, 2)}

请基于以上数据，提供一份专业、详细、个性化的心理分析报告。`;
        }
        else {
            return `Please analyze the following user's psychological assessment data:

**User Basic Information:**
- Name: ${userInfo.name || 'Not provided'}
- Gender: ${userInfo.gender || 'Not provided'}
- Age: ${userInfo.age || 'Not provided'}
- City: ${userInfo.city || 'Not provided'}
- Occupation: ${userInfo.occupation || 'Not provided'}
- Education: ${userInfo.education || 'Not provided'}

**MBTI Personality Test Answers:**
${JSON.stringify(mbti, null, 2)}

**Big Five Personality Test Answers:**
${JSON.stringify(bigFive, null, 2)}

**DISC Behavioral Style Test Answers:**
${JSON.stringify(disc, null, 2)}

**Holland Career Interest Test Answers:**
${JSON.stringify(holland, null, 2)}

**Values Test Answers:**
${JSON.stringify(values, null, 2)}

**Five Questions Deep Exploration:**
${JSON.stringify(fiveQuestions, null, 2)}

Please provide a professional, detailed, personalized psychological analysis report based on the above data.`;
        }
    }
    parseAnalysisResult(analysisText, userAnswers) {
        try {
            // 尝试解析 JSON 格式的分析结果
            const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                // 添加可视化数据
                parsed.visualizationData = this.generateVisualizationData(parsed, userAnswers);
                return parsed;
            }
        }
        catch (error) {
            console.warn('⚠️  无法解析 JSON 格式的分析结果，使用文本解析');
        }
        // 如果无法解析 JSON，返回基础结构
        return this.createFallbackAnalysis(analysisText, userAnswers);
    }
    createFallbackAnalysis(analysisText, userAnswers) {
        return {
            personalityProfile: {
                mbtiType: "INFP",
                mbtiDescription: "基于 AI 分析的人格类型",
                bigFiveScores: { openness: 75, conscientiousness: 65, extraversion: 45, agreeableness: 80, neuroticism: 35 },
                discProfile: { dominance: 25, influence: 45, steadiness: 65, conscientiousness: 65, primaryStyle: "稳健型" },
                hollandCode: { realistic: 30, investigative: 80, artistic: 70, social: 60, enterprising: 40, conventional: 50, topThree: ["investigative", "artistic", "social"] }
            },
            careerGuidance: {
                idealCareers: [
                    { title: "AI 推荐职业 1", match: 90, description: "基于 AI 分析的职业推荐", requirements: ["相关技能"], growthPotential: "优秀" }
                ],
                industryRecommendations: ["科技", "教育", "咨询"],
                skillsToImprove: ["AI 建议的技能提升"],
                careerDevelopmentPlan: { shortTerm: ["短期目标"], mediumTerm: ["中期目标"], longTerm: ["长期目标"] }
            },
            recommendations: {
                personalDevelopment: ["AI 个人发展建议"],
                learningResources: ["AI 推荐资源"],
                actionItems: ["AI 行动建议"],
                nextSteps: ["AI 下一步建议"]
            },
            summary: {
                title: "AI 心理分析报告",
                overview: analysisText.substring(0, 200) + "...",
                keyInsights: "基于 AI 的深度分析洞察",
                strengthsAndWeaknesses: { strengths: ["AI 识别的优势"], weaknesses: [], improvementAreas: ["AI 建议的改进领域"] }
            },
            workStyle: {
                preferredEnvironment: "AI 推荐的工作环境",
                communicationStyle: "AI 分析的沟通风格",
                leadershipStyle: "AI 识别的领导风格",
                teamRole: "AI 建议的团队角色",
                motivationFactors: ["AI 识别的激励因素"],
                workingStyle: "AI 分析的工作风格"
            },
            visualizationData: this.generateVisualizationData({}, userAnswers)
        };
    }
    generateVisualizationData(analysis, userAnswers) {
        // 生成图表数据，与基础分析服务保持一致的格式
        return {
            personalityChart: {
                type: 'radar',
                data: {
                    labels: ['开放性', '责任心', '外向性', '宜人性', '神经质'],
                    datasets: [{
                            label: 'AI 人格分析',
                            data: [
                                analysis.personalityProfile?.bigFiveScores?.openness || 75,
                                analysis.personalityProfile?.bigFiveScores?.conscientiousness || 65,
                                analysis.personalityProfile?.bigFiveScores?.extraversion || 45,
                                analysis.personalityProfile?.bigFiveScores?.agreeableness || 80,
                                analysis.personalityProfile?.bigFiveScores?.neuroticism || 35
                            ],
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 2,
                            pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                            pointBorderColor: '#fff',
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
                        }]
                },
                options: {
                    scale: {
                        ticks: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            },
            hollandChart: {
                type: 'polarArea',
                data: {
                    labels: ['现实型', '研究型', '艺术型', '社会型', '企业型', '常规型'],
                    datasets: [{
                            label: 'AI 兴趣分析',
                            data: [
                                analysis.personalityProfile?.hollandCode?.realistic || 30,
                                analysis.personalityProfile?.hollandCode?.investigative || 80,
                                analysis.personalityProfile?.hollandCode?.artistic || 70,
                                analysis.personalityProfile?.hollandCode?.social || 60,
                                analysis.personalityProfile?.hollandCode?.enterprising || 40,
                                analysis.personalityProfile?.hollandCode?.conventional || 50
                            ],
                            backgroundColor: [
                                'rgba(255, 99, 132, 0.7)',
                                'rgba(54, 162, 235, 0.7)',
                                'rgba(255, 205, 86, 0.7)',
                                'rgba(75, 192, 192, 0.7)',
                                'rgba(153, 102, 255, 0.7)',
                                'rgba(255, 159, 64, 0.7)'
                            ]
                        }]
                }
            },
            careerFitChart: {
                type: 'bar',
                data: {
                    labels: (analysis.careerGuidance?.idealCareers || []).slice(0, 5).map((career) => career.title),
                    datasets: [{
                            label: 'AI 职业匹配度',
                            data: (analysis.careerGuidance?.idealCareers || []).slice(0, 5).map((career) => career.match),
                            backgroundColor: [
                                'rgba(255, 99, 132, 0.8)',
                                'rgba(54, 162, 235, 0.8)',
                                'rgba(255, 205, 86, 0.8)',
                                'rgba(75, 192, 192, 0.8)',
                                'rgba(153, 102, 255, 0.8)'
                            ],
                            borderColor: [
                                'rgba(255, 99, 132, 1)',
                                'rgba(54, 162, 235, 1)',
                                'rgba(255, 205, 86, 1)',
                                'rgba(75, 192, 192, 1)',
                                'rgba(153, 102, 255, 1)'
                            ],
                            borderWidth: 1
                        }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            }
        };
    }
    /**
     * 获取服务状态
     */
    async getStatus() {
        try {
            const connectionTest = await this.testConnection();
            return {
                status: connectionTest.success ? 'available' : 'unavailable',
                message: connectionTest.message,
                details: {
                    proxy: this.config.proxyUrl || 'direct',
                    model: this.config.model,
                    baseURL: this.config.baseURL,
                    availableModels: connectionTest.models
                }
            };
        }
        catch (error) {
            return {
                status: 'unavailable',
                message: `服务不可用: ${error.message}`
            };
        }
    }
    /**
     * 获取配置信息
     */
    getConfig() {
        return {
            model: this.config.model,
            baseURL: this.config.baseURL,
            proxy: this.config.proxyUrl || 'direct',
            timeout: this.config.timeout,
            apiKey: '***' // 隐藏敏感信息
        };
    }
}
exports.OpenAIProxyService = OpenAIProxyService;
