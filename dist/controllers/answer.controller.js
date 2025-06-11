"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnswerController = void 0;
const factory_1 = require("../services/factory");
class AnswerController {
    // 提交答案
    async submitAnswers(req, res) {
        try {
            const data = req.body;
            // 验证数据
            if (!data.userInfo || !data.fiveQuestions || !data.mbti || !data.bigFive || !data.disc || !data.holland || !data.values) {
                return res.status(400).json({
                    error: '数据不完整',
                });
            }
            // 获取知识库服务
            const knowledgeBase = factory_1.ServiceFactory.createKnowledgeBase({
                type: 'supabase',
                connection_string: process.env.SUPABASE_CONNECTION_STRING || '',
                database: process.env.SUPABASE_DATABASE || '',
            });
            // 1. 创建用户基本信息记录
            const userEntry = {
                model_tag: 'user_survey',
                content: JSON.stringify({
                    name: data.userInfo.name,
                    gender: data.userInfo.gender,
                    age: data.userInfo.age,
                    city: data.userInfo.city,
                    occupation: data.userInfo.occupation,
                    education: data.userInfo.education,
                    phone: data.userInfo.phone,
                }),
                metadata: {
                    type: 'user_survey',
                    status: 'pending',
                },
            };
            const userSurvey = await knowledgeBase.addEntry(userEntry);
            // 2. 获取所有模型
            const modelEntries = await knowledgeBase.getEntries('survey_model');
            const models = modelEntries
                .map(entry => JSON.parse(entry.content))
                .filter(model => ['fiveq', 'mbti', 'big5', 'disc', 'holland', 'motivation'].includes(model.code));
            // 3. 获取所有题目
            const questionEntries = await knowledgeBase.getEntries('survey_question');
            const questions = questionEntries
                .map(entry => JSON.parse(entry.content))
                .filter(question => models.some(model => model.id === question.model_id));
            // 4. 准备所有答案数据
            const answers = [];
            // 处理五问法答案
            const fiveqModel = models.find(m => m.code === 'fiveq');
            if (fiveqModel) {
                Object.entries(data.fiveQuestions).forEach(([questionCode, answer]) => {
                    const question = questions.find(q => q.model_id === fiveqModel.id && q.question_code === questionCode);
                    if (question) {
                        answers.push({
                            user_survey_id: userSurvey.id,
                            question_id: question.id,
                            model_id: fiveqModel.id,
                            answer: answer,
                        });
                    }
                });
            }
            // 处理MBTI答案
            const mbtiModel = models.find(m => m.code === 'mbti');
            if (mbtiModel) {
                Object.entries(data.mbti).forEach(([questionCode, answer]) => {
                    const question = questions.find(q => q.model_id === mbtiModel.id && q.question_code === questionCode);
                    if (question) {
                        answers.push({
                            user_survey_id: userSurvey.id,
                            question_id: question.id,
                            model_id: mbtiModel.id,
                            answer: answer,
                        });
                    }
                });
            }
            // 处理五大人格答案
            const big5Model = models.find(m => m.code === 'big5');
            if (big5Model) {
                Object.entries(data.bigFive).forEach(([questionCode, answer]) => {
                    const question = questions.find(q => q.model_id === big5Model.id && q.question_code === questionCode);
                    if (question) {
                        answers.push({
                            user_survey_id: userSurvey.id,
                            question_id: question.id,
                            model_id: big5Model.id,
                            answer: answer,
                        });
                    }
                });
            }
            // 处理DISC答案
            const discModel = models.find(m => m.code === 'disc');
            if (discModel) {
                Object.entries(data.disc).forEach(([questionCode, answer]) => {
                    const question = questions.find(q => q.model_id === discModel.id && q.question_code === questionCode);
                    if (question) {
                        answers.push({
                            user_survey_id: userSurvey.id,
                            question_id: question.id,
                            model_id: discModel.id,
                            answer: answer,
                        });
                    }
                });
            }
            // 处理霍兰德答案
            const hollandModel = models.find(m => m.code === 'holland');
            if (hollandModel) {
                Object.entries(data.holland).forEach(([questionCode, answer]) => {
                    const question = questions.find(q => q.model_id === hollandModel.id && q.question_code === questionCode);
                    if (question) {
                        answers.push({
                            user_survey_id: userSurvey.id,
                            question_id: question.id,
                            model_id: hollandModel.id,
                            answer: answer,
                        });
                    }
                });
            }
            // 处理价值观答案
            const motivationModel = models.find(m => m.code === 'motivation');
            if (motivationModel) {
                Object.entries(data.values).forEach(([questionCode, answer]) => {
                    const question = questions.find(q => q.model_id === motivationModel.id && q.question_code === questionCode);
                    if (question) {
                        // 如果是拖拽排序题且没有答案，使用初始顺序 [1,2,3,4,5]
                        if (question.type === 'sorting' && (!answer || !answer.order)) {
                            answer = { order: [1, 2, 3, 4, 5] };
                        }
                        answers.push({
                            user_survey_id: userSurvey.id,
                            question_id: question.id,
                            model_id: motivationModel.id,
                            answer: answer,
                        });
                    }
                });
            }
            // 5. 保存所有答案
            for (const answer of answers) {
                await knowledgeBase.addEntry({
                    model_tag: 'user_survey_answer',
                    content: JSON.stringify(answer),
                    metadata: {
                        type: 'user_survey_answer',
                        user_survey_id: answer.user_survey_id,
                    },
                });
            }
            // 返回成功响应
            res.json({
                message: '测试结果保存成功',
                surveyId: userSurvey.id,
            });
        }
        catch (error) {
            console.error('处理测试提交失败:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : '处理测试提交失败',
            });
        }
    }
}
exports.AnswerController = AnswerController;
