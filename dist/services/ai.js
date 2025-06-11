"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzePersonality = exports.analyzeWithRetry = void 0;
const openai_1 = __importDefault(require("openai"));
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
const generatePrompt = ({ modelType, answers, knowledgeBase }) => {
    const knowledgeContent = knowledgeBase.map(k => k.content).join('\n');
    return `Based on the following personality test answers and knowledge base, please provide a detailed analysis:

Model Type: ${modelType}

Knowledge Base:
${knowledgeContent}

User Answers:
${JSON.stringify(answers, null, 2)}

Please provide:
1. A detailed analysis of the personality traits
2. Key insights and observations
3. A concise summary (max 200 words)`;
};
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const analyzeWithRetry = async (prompt, retryCount = 0) => {
    try {
        const completion = await openai.chat.completions.create({
            model: config_1.default.ai_service.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: config_1.default.ai_service.temperature,
            max_tokens: config_1.default.ai_service.max_tokens,
        });
        return completion.choices[0].message.content || '';
    }
    catch (error) {
        if (retryCount < config_1.default.ai_service.retry_count) {
            logger_1.default.warn(`Retrying AI analysis (attempt ${retryCount + 1})`);
            await sleep(config_1.default.ai_service.retry_delay);
            return (0, exports.analyzeWithRetry)(prompt, retryCount + 1);
        }
        logger_1.default.error('AI analysis failed after retries:', error);
        throw error;
    }
};
exports.analyzeWithRetry = analyzeWithRetry;
const analyzePersonality = async (data) => {
    try {
        const prompt = generatePrompt(data);
        const analysis = await (0, exports.analyzeWithRetry)(prompt);
        // Extract summary from analysis (assuming it's the last part)
        const summaryMatch = analysis.match(/Summary:([\s\S]*?)$/);
        const summary = summaryMatch ? summaryMatch[1].trim() : analysis.slice(-200);
        return {
            analysis,
            summary,
        };
    }
    catch (error) {
        logger_1.default.error('Error in personality analysis:', error);
        throw error;
    }
};
exports.analyzePersonality = analyzePersonality;
exports.default = {
    analyzePersonality: exports.analyzePersonality,
};
