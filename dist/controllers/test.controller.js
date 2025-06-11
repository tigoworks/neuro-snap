"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestController = void 0;
const supabase_service_1 = require("../services/supabase.service");
const logger_1 = __importDefault(require("../utils/logger"));
class TestController {
    constructor() {
        this.supabaseService = supabase_service_1.SupabaseService.getInstance();
    }
    // 提交测试结果接口 - POST /api/submit-test
    async submitTest(req, res) {
        try {
            const data = req.body;
            // 验证数据完整性
            if (!data.userInfo || !data.userInfo.name || !data.userInfo.gender) {
                return res.status(400).json({
                    error: '数据不完整',
                });
            }
            // 1. 保存用户信息
            let userId;
            try {
                const { data: userData, error: userError } = await this.supabaseService.getClient()
                    .from('user_survey')
                    .insert({
                    name: data.userInfo.name,
                    gender: data.userInfo.gender,
                    age: data.userInfo.age,
                    city: data.userInfo.city,
                    occupation: data.userInfo.occupation,
                    education: data.userInfo.education,
                    phone: data.userInfo.phone,
                })
                    .select()
                    .single();
                if (userError)
                    throw userError;
                userId = userData.id;
                logger_1.default.info(`User info saved with ID: ${userId}`);
            }
            catch (error) {
                logger_1.default.error('Error saving user info:', error);
                return res.status(500).json({
                    error: '保存用户信息失败',
                });
            }
            // 2. 获取所有模型信息用于后续答案保存
            let models = {};
            try {
                const { data: modelsData, error: modelsError } = await this.supabaseService.getClient()
                    .from('survey_model')
                    .select('*');
                if (modelsError)
                    throw modelsError;
                modelsData?.forEach((model) => {
                    models[model.code] = model;
                });
            }
            catch (error) {
                logger_1.default.error('Error getting models:', error);
                return res.status(500).json({
                    error: '获取模型信息失败',
                });
            }
            // 3. 获取所有题目信息
            let questions = {};
            try {
                const { data: questionsData, error: questionsError } = await this.supabaseService.getClient()
                    .from('survey_question')
                    .select('*');
                if (questionsError)
                    throw questionsError;
                questionsData?.forEach((question) => {
                    questions[question.question_code] = question;
                });
            }
            catch (error) {
                logger_1.default.error('Error getting questions:', error);
                return res.status(500).json({
                    error: '获取题目信息失败',
                });
            }
            // 4. 保存各个测试的答案
            const answerSets = [
                { key: 'fiveQuestions', modelCode: 'fiveq', data: data.fiveQuestions },
                { key: 'mbti', modelCode: 'mbti', data: data.mbti },
                { key: 'bigFive', modelCode: 'big5', data: data.bigFive },
                { key: 'disc', modelCode: 'disc', data: data.disc },
                { key: 'holland', modelCode: 'holland', data: data.holland },
                { key: 'values', modelCode: 'motivation', data: data.values },
            ];
            try {
                for (const answerSet of answerSets) {
                    if (answerSet.data && models[answerSet.modelCode]) {
                        const model = models[answerSet.modelCode];
                        // 遍历每个答案
                        for (const [questionCode, answer] of Object.entries(answerSet.data)) {
                            const question = questions[questionCode];
                            if (question) {
                                await this.supabaseService.getClient()
                                    .from('user_survey_answer')
                                    .insert({
                                    user_survey_id: userId,
                                    question_id: question.id,
                                    model_id: model.id,
                                    answer: answer, // JSONB字段，支持各种格式的答案
                                });
                            }
                        }
                        logger_1.default.info(`Saved answers for ${answerSet.modelCode}: ${Object.keys(answerSet.data).length} questions`);
                    }
                }
            }
            catch (error) {
                logger_1.default.error('Error saving answers:', error);
                return res.status(500).json({
                    error: '保存答案失败',
                });
            }
            // 5. 返回成功响应
            res.json({
                message: '测试结果保存成功',
            });
            logger_1.default.info(`Test submission completed successfully for user: ${userId}`);
        }
        catch (error) {
            logger_1.default.error('Error in test submission:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : '处理测试提交失败',
            });
        }
    }
}
exports.TestController = TestController;
