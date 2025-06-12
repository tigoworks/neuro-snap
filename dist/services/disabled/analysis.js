"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisService = void 0;
const factory_1 = require("./factory");
const logger_1 = __importDefault(require("../utils/logger"));
const db = __importStar(require("./database"));
class AnalysisService {
    async performAnalysis(userId, modelType) {
        logger_1.default.info(`Starting analysis for user ${userId} with model ${modelType}`);
        try {
            // 1. 获取用户调查数据
            const survey = await db.getSurveyByUserId(userId);
            if (!survey) {
                throw new Error('User survey not found');
            }
            // 2. 获取用户答案
            const rawAnswers = await db.getRawAnswersBySurveyId(survey.id);
            if (!rawAnswers || rawAnswers.length === 0) {
                throw new Error('No answers found for this survey');
            }
            // 3. 获取知识库数据
            const knowledgeBase = await db.getKnowledgeBaseByModel(modelType);
            if (!knowledgeBase || knowledgeBase.length === 0) {
                throw new Error('Knowledge base not found for this model');
            }
            // 4. 创建AI服务
            const aiService = factory_1.ServiceFactory.createAIService({
                provider: 'openai',
                model: 'gpt-3.5-turbo',
                temperature: 0.7,
                max_tokens: 1000,
            });
            // 5. 构建分析提示
            const prompt = this.buildAnalysisPrompt(rawAnswers, knowledgeBase, modelType);
            // 6. 执行AI分析
            const analysisText = await aiService.generateResponse(prompt);
            // 7. 保存分析结果
            const result = await db.saveAnalysisResult({
                user_id: userId,
                model_type: modelType,
                analysis_text: analysisText,
                status: 'completed',
                metadata: {
                    prompt_length: prompt.length,
                    response_length: analysisText.length,
                    model_used: 'gpt-3.5-turbo',
                },
            });
            logger_1.default.info(`Analysis completed for user ${userId}`);
            return result;
        }
        catch (error) {
            logger_1.default.error(`Analysis failed for user ${userId}:`, error);
            // 更新状态为失败
            const survey = await db.getSurveyByUserId(userId);
            if (survey) {
                await db.updateSurveyStatus(survey.id, 'failed');
            }
            throw error;
        }
    }
    buildAnalysisPrompt(answers, knowledgeBase, modelType) {
        // 构建分析提示的逻辑
        const answersText = answers.map(a => `${a.question_id}: ${JSON.stringify(a.answer)}`).join('\n');
        const knowledgeText = knowledgeBase.map(k => k.content).join('\n');
        return `
      分析以下${modelType}测试的答案：
      
      答案：
      ${answersText}
      
      知识库：
      ${knowledgeText}
      
      请根据答案和知识库给出详细的分析报告。
    `;
    }
    async getAnalysisStatus(userId) {
        try {
            const result = await db.getAnalysisResultByUserId(userId);
            return { status: 'completed', result };
        }
        catch (error) {
            return { status: 'not_found' };
        }
    }
}
exports.AnalysisService = AnalysisService;
