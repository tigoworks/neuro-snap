"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleAnalysisService = void 0;
const database_logger_service_1 = require("./database-logger.service");
const crypto_1 = __importDefault(require("crypto"));
class SimpleAnalysisService {
    constructor() {
        this.logger = database_logger_service_1.DatabaseLoggerService.getInstance();
    }
    /**
     * 执行简化分析（基于规则的分析，不依赖OpenAI）
     */
    async performAnalysis(request) {
        const startTime = Date.now();
        const analysisId = crypto_1.default.randomUUID();
        try {
            console.log(`📊 开始基础分析: ${request.userId}`);
            // 分析用户信息
            const userProfile = this.analyzeUserProfile(request.userAnswers.userInfo || {});
            // 分析MBTI
            const mbtiAnalysis = this.analyzeMBTI(request.userAnswers.mbti || {});
            // 分析大五人格
            const bigFiveAnalysis = this.analyzeBigFive(request.userAnswers.bigFive || {});
            // 分析DISC
            const discAnalysis = this.analyzeDISC(request.userAnswers.disc || {});
            // 分析霍兰德
            const hollandAnalysis = this.analyzeHolland(request.userAnswers.holland || {});
            // 分析价值观
            const valuesAnalysis = this.analyzeValues(request.userAnswers.values || {});
            // 综合分析
            const insights = this.generateInsights({
                userProfile,
                mbti: mbtiAnalysis,
                bigFive: bigFiveAnalysis,
                disc: discAnalysis,
                holland: hollandAnalysis,
                values: valuesAnalysis
            });
            const processingTime = Date.now() - startTime;
            const result = {
                id: analysisId,
                userId: request.userId,
                summary: insights.summary,
                personalityInsights: insights.personalityInsights,
                careerRecommendations: insights.careerRecommendations,
                strengths: insights.strengths,
                improvementAreas: insights.improvementAreas,
                confidence: insights.confidence,
                processingTime,
                createdAt: new Date()
            };
            console.log(`✅ 基础分析完成: ${analysisId} (${processingTime}ms)`);
            return result;
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            console.error('❌ 分析失败:', error);
            throw new Error(`分析失败: ${error.message}`);
        }
    }
    analyzeUserProfile(userInfo) {
        return {
            age: userInfo.age || 0,
            gender: userInfo.gender || 'unknown',
            education: userInfo.education || 'unknown',
            occupation: userInfo.occupation || 'unknown',
            city: userInfo.city || 'unknown'
        };
    }
    analyzeMBTI(mbtiData) {
        // 简化的MBTI分析逻辑
        const answers = Object.values(mbtiData);
        const scores = {
            E: 0, I: 0, // 外向/内向
            S: 0, N: 0, // 感觉/直觉
            T: 0, F: 0, // 思考/情感
            J: 0, P: 0 // 判断/知觉
        };
        // 基于答案计算得分（简化逻辑）
        answers.forEach((answer, index) => {
            const value = parseInt(answer) || 1;
            switch (index % 4) {
                case 0:
                    value > 2 ? scores.E++ : scores.I++;
                    break;
                case 1:
                    value > 2 ? scores.S++ : scores.N++;
                    break;
                case 2:
                    value > 2 ? scores.T++ : scores.F++;
                    break;
                case 3:
                    value > 2 ? scores.J++ : scores.P++;
                    break;
            }
        });
        const type = `${scores.E > scores.I ? 'E' : 'I'}${scores.S > scores.N ? 'S' : 'N'}${scores.T > scores.F ? 'T' : 'F'}${scores.J > scores.P ? 'J' : 'P'}`;
        return {
            type,
            description: this.getMBTIDescription(type),
            dimensions: {
                EI: scores.E > scores.I ? 'E' : 'I',
                SN: scores.S > scores.N ? 'S' : 'N',
                TF: scores.T > scores.F ? 'T' : 'F',
                JP: scores.J > scores.P ? 'J' : 'P'
            }
        };
    }
    analyzeBigFive(bigFiveData) {
        const scores = {
            openness: 50,
            conscientiousness: 50,
            extraversion: 50,
            agreeableness: 50,
            neuroticism: 50
        };
        // 基于答案计算分数（简化逻辑）
        Object.entries(bigFiveData).forEach(([key, value]) => {
            const score = parseInt(value) || 3;
            if (key.includes('o_'))
                scores.openness += (score - 3) * 10;
            if (key.includes('c_'))
                scores.conscientiousness += (score - 3) * 10;
            if (key.includes('e_'))
                scores.extraversion += (score - 3) * 10;
            if (key.includes('a_'))
                scores.agreeableness += (score - 3) * 10;
            if (key.includes('n_'))
                scores.neuroticism += (score - 3) * 10;
        });
        // 限制在0-100范围内
        Object.keys(scores).forEach(key => {
            scores[key] = Math.max(0, Math.min(100, scores[key]));
        });
        return scores;
    }
    analyzeDISC(discData) {
        const scores = { D: 0, I: 0, S: 0, C: 0 };
        Object.entries(discData).forEach(([key, value]) => {
            const score = parseInt(value) || 1;
            if (key.includes('d_'))
                scores.D += score;
            if (key.includes('i_'))
                scores.I += score;
            if (key.includes('s_'))
                scores.S += score;
            if (key.includes('c_'))
                scores.C += score;
        });
        const total = scores.D + scores.I + scores.S + scores.C;
        const percentages = {
            dominance: total > 0 ? Math.round((scores.D / total) * 100) : 25,
            influence: total > 0 ? Math.round((scores.I / total) * 100) : 25,
            steadiness: total > 0 ? Math.round((scores.S / total) * 100) : 25,
            conscientiousness: total > 0 ? Math.round((scores.C / total) * 100) : 25
        };
        const primaryStyle = Object.entries(percentages).reduce((a, b) => percentages[a[0]] > percentages[b[0]] ? a : b)[0];
        return {
            scores: percentages,
            primaryStyle: this.getDISCStyleName(primaryStyle)
        };
    }
    analyzeHolland(hollandData) {
        const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
        Object.entries(hollandData).forEach(([key, value]) => {
            const score = parseInt(value) || 1;
            if (key.includes('r_'))
                scores.R += score;
            if (key.includes('i_'))
                scores.I += score;
            if (key.includes('a_'))
                scores.A += score;
            if (key.includes('s_'))
                scores.S += score;
            if (key.includes('e_'))
                scores.E += score;
            if (key.includes('c_'))
                scores.C += score;
        });
        const total = Object.values(scores).reduce((a, b) => a + b, 0);
        const percentages = {
            realistic: total > 0 ? Math.round((scores.R / total) * 100) : 16,
            investigative: total > 0 ? Math.round((scores.I / total) * 100) : 16,
            artistic: total > 0 ? Math.round((scores.A / total) * 100) : 16,
            social: total > 0 ? Math.round((scores.S / total) * 100) : 16,
            enterprising: total > 0 ? Math.round((scores.E / total) * 100) : 16,
            conventional: total > 0 ? Math.round((scores.C / total) * 100) : 16
        };
        const topThree = Object.entries(percentages)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([type]) => type);
        return {
            scores: percentages,
            topThree,
            code: topThree.map(t => t[0].toUpperCase()).join('')
        };
    }
    analyzeValues(valuesData) {
        const categories = {
            achievement: 0,
            security: 0,
            relationship: 0,
            autonomy: 0,
            service: 0
        };
        Object.entries(valuesData).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach(v => {
                    const val = parseInt(v) || 0;
                    // 简化的价值观分类逻辑
                    if (val <= 2)
                        categories.achievement++;
                    else if (val <= 4)
                        categories.security++;
                    else if (val <= 6)
                        categories.relationship++;
                    else if (val <= 8)
                        categories.autonomy++;
                    else
                        categories.service++;
                });
            }
        });
        return categories;
    }
    generateInsights(analyses) {
        const { userProfile, mbti, bigFive, disc, holland, values } = analyses;
        // 生成综合分析
        const summary = `基于测评结果，您的MBTI类型为${mbti.type}，表现出${disc.primaryStyle}的行为风格，在${holland.topThree[0]}类型的职业环境中可能更有优势。`;
        const personalityInsights = [
            `您的MBTI类型是${mbti.type}（${mbti.description}）`,
            `在大五人格中，开放性得分${bigFive.openness}，责任心得分${bigFive.conscientiousness}`,
            `DISC行为风格主要表现为${disc.primaryStyle}`,
            `霍兰德兴趣代码为${holland.code}，最匹配${holland.topThree.join('、')}类型工作`
        ];
        const careerRecommendations = this.getCareerRecommendations(mbti.type, holland.topThree, disc.primaryStyle);
        const strengths = this.getStrengths(mbti.type, bigFive, disc.primaryStyle);
        const improvementAreas = this.getImprovementAreas(bigFive, mbti.type);
        // 计算置信度
        const confidence = this.calculateConfidence(analyses);
        return {
            summary,
            personalityInsights,
            careerRecommendations,
            strengths,
            improvementAreas,
            confidence
        };
    }
    getMBTIDescription(type) {
        const descriptions = {
            'INTJ': '建筑师：独立思考者，具有强烈的直觉和决策能力',
            'INTP': '思想家：好奇心强，喜欢理论和抽象概念',
            'ENTJ': '指挥官：天生的领导者，善于组织和规划',
            'ENTP': '辩论家：创新者，善于发现新的可能性',
            'INFJ': '提倡者：理想主义者，有强烈的道德感',
            'INFP': '调停者：富有创造力，忠于自己的价值观',
            'ENFJ': '主人公：富有魅力的领导者，善于激励他人',
            'ENFP': '竞选者：热情洋溢，富有创造力和社交能力',
            'ISTJ': '物流师：务实可靠，注重细节和传统',
            'ISFJ': '守护者：温暖贴心，乐于帮助他人',
            'ESTJ': '总经理：高效的组织者，善于管理和执行',
            'ESFJ': '执政官：关心他人，善于营造和谐氛围',
            'ISTP': '鉴赏家：灵活适应，善于解决实际问题',
            'ISFP': '探险家：温和友善，追求内心和谐',
            'ESTP': '企业家：精力充沛，善于抓住机会',
            'ESFP': '表演者：热情友好，喜欢与人互动'
        };
        return descriptions[type] || '独特的人格类型';
    }
    getDISCStyleName(style) {
        const names = {
            dominance: '支配型',
            influence: '影响型',
            steadiness: '稳健型',
            conscientiousness: '谨慎型'
        };
        return names[style] || '混合型';
    }
    getCareerRecommendations(mbtiType, hollandTypes, discStyle) {
        // 简化的职业推荐逻辑
        const recommendations = [];
        if (hollandTypes.includes('investigative')) {
            recommendations.push('数据分析师', '研究员', '软件工程师');
        }
        if (hollandTypes.includes('social')) {
            recommendations.push('心理咨询师', '教师', '人力资源专员');
        }
        if (hollandTypes.includes('artistic')) {
            recommendations.push('设计师', '作家', '音乐家');
        }
        if (hollandTypes.includes('enterprising')) {
            recommendations.push('销售经理', '企业家', '市场营销');
        }
        if (hollandTypes.includes('conventional')) {
            recommendations.push('会计师', '行政助理', '项目协调员');
        }
        if (hollandTypes.includes('realistic')) {
            recommendations.push('工程师', '技术员', '建筑师');
        }
        return recommendations.slice(0, 5);
    }
    getStrengths(mbtiType, bigFive, discStyle) {
        const strengths = [];
        if (bigFive.openness > 60)
            strengths.push('富有创造力', '乐于接受新事物');
        if (bigFive.conscientiousness > 60)
            strengths.push('认真负责', '注重细节');
        if (bigFive.extraversion > 60)
            strengths.push('善于社交', '活力充沛');
        if (bigFive.agreeableness > 60)
            strengths.push('善于合作', '值得信赖');
        if (bigFive.neuroticism < 40)
            strengths.push('情绪稳定', '抗压能力强');
        return strengths.length > 0 ? strengths : ['独特的个人魅力', '具有发展潜力'];
    }
    getImprovementAreas(bigFive, mbtiType) {
        const areas = [];
        if (bigFive.extraversion < 40)
            areas.push('提高社交技能', '增强沟通表达');
        if (bigFive.conscientiousness < 40)
            areas.push('提升时间管理', '加强执行力');
        if (bigFive.openness < 40)
            areas.push('培养创新思维', '接受新观念');
        if (bigFive.neuroticism > 60)
            areas.push('情绪管理', '压力调节');
        return areas.length > 0 ? areas : ['持续学习成长', '保持平衡发展'];
    }
    calculateConfidence(analyses) {
        let confidence = 0.6; // 基础置信度
        // 根据数据完整性调整
        const dataCompleteness = Object.values(analyses).filter(a => a && Object.keys(a).length > 0).length / 6;
        confidence += dataCompleteness * 0.3;
        return Math.min(confidence, 0.95); // 最高95%
    }
}
exports.SimpleAnalysisService = SimpleAnalysisService;
