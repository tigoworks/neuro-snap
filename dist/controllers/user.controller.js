"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const supabase_service_1 = require("../services/supabase.service");
const database_logger_service_1 = require("../services/database-logger.service");
const logger_1 = __importDefault(require("../utils/logger"));
class UserController {
    constructor() {
        this.supabaseService = supabase_service_1.SupabaseService.getInstance();
        this.dbLogger = database_logger_service_1.DatabaseLoggerService.getInstance();
    }
    // 保存用户信息
    async saveUserInfo(req, res) {
        const client = this.supabaseService.getClient();
        try {
            const userInfo = req.body;
            // 验证必填字段
            if (!userInfo.name || !userInfo.gender || !userInfo.age || !userInfo.city || !userInfo.occupation || !userInfo.education) {
                return res.status(400).json({
                    error: '缺少必填字段：姓名、性别、年龄、城市、职业、学历',
                });
            }
            // 转换性别格式
            const gender = userInfo.gender === '男' ? 'male' : userInfo.gender === '女' ? 'female' : 'unknown';
            // 转换年龄为数字
            const age = typeof userInfo.age === 'string' ? parseInt(userInfo.age, 10) : userInfo.age;
            if (isNaN(age) || age < 1 || age > 120) {
                return res.status(400).json({
                    error: '年龄必须是1-120之间的有效数字',
                });
            }
            logger_1.default.info('🔄 Starting user info transaction', {
                service: 'neuro-snap-backend',
                operation: 'saveUserInfo',
                inputParams: {
                    originalData: userInfo,
                    processedData: { name: userInfo.name, gender, age, city: userInfo.city }
                }
            });
            // 开始事务控制的用户信息保存
            const transactionId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            logger_1.default.info('🚀 Transaction Started', {
                service: 'neuro-snap-backend',
                transactionId,
                operation: 'saveUserInfo',
                inputParams: {
                    fields: Object.keys(userInfo),
                    hasPhone: !!userInfo.phone,
                    dataValidation: {
                        nameLength: userInfo.name?.length || 0,
                        genderOriginal: userInfo.gender,
                        genderMapped: gender,
                        ageOriginal: userInfo.age,
                        ageParsed: age
                    }
                }
            });
            const userData = {
                name: userInfo.name,
                gender,
                age,
                city: userInfo.city,
                occupation: userInfo.occupation,
                education: userInfo.education,
                phone: userInfo.phone || null,
                submit_time: new Date().toISOString()
            };
            // 插入用户信息到 user_survey 表
            const startTime = Date.now();
            const { data: insertedUser, error: insertError } = await client
                .from('user_survey')
                .insert([userData])
                .select('*')
                .single();
            const duration = Date.now() - startTime;
            if (insertedUser) {
                this.dbLogger.logQuerySuccess(`${transactionId}_insert`, insertedUser, startTime, {
                    table: 'user_survey',
                    operation: 'INSERT',
                    data: userData,
                    inputParams: {
                        originalUserInfo: userInfo,
                        transformedData: userData,
                        validationResults: {
                            ageValid: !isNaN(age) && age >= 1 && age <= 120,
                            genderMapped: `${userInfo.gender} -> ${gender}`,
                            requiredFieldsPresent: {
                                name: !!userInfo.name,
                                gender: !!userInfo.gender,
                                age: !!userInfo.age,
                                city: !!userInfo.city,
                                occupation: !!userInfo.occupation,
                                education: !!userInfo.education
                            }
                        }
                    }
                });
            }
            if (insertError) {
                logger_1.default.error('❌ Database insert error', {
                    service: 'neuro-snap-backend',
                    transactionId,
                    error: insertError.message,
                    code: insertError.code
                });
                logger_1.default.error('🔄 Transaction Rollback', {
                    service: 'neuro-snap-backend',
                    transactionId,
                    reason: 'Insert failed'
                });
                return res.status(500).json({
                    error: '保存用户信息失败',
                    details: insertError.message
                });
            }
            logger_1.default.info('✅ Transaction Committed', {
                service: 'neuro-snap-backend',
                transactionId,
                userId: insertedUser.id,
                duration: `${Date.now() - startTime}ms`
            });
            logger_1.default.info('🎉 User info saved successfully', {
                service: 'neuro-snap-backend',
                userId: insertedUser.id,
                name: insertedUser.name,
                transactionId
            });
            // 返回保存的用户信息
            res.json({
                data: {
                    id: insertedUser.id,
                    name: insertedUser.name,
                    gender: insertedUser.gender,
                    age: insertedUser.age,
                    city: insertedUser.city,
                    occupation: insertedUser.occupation,
                    education: insertedUser.education,
                    phone: insertedUser.phone,
                    submit_time: insertedUser.submit_time,
                },
            });
        }
        catch (error) {
            logger_1.default.error('💥 Error in user info API', {
                service: 'neuro-snap-backend',
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            res.status(500).json({
                error: error instanceof Error ? error.message : '保存用户信息时发生错误',
            });
        }
    }
    // 获取用户信息
    async getUserInfo(req, res) {
        const client = this.supabaseService.getClient();
        try {
            const { userId } = req.params;
            if (!userId) {
                return res.status(400).json({
                    error: '用户ID不能为空',
                });
            }
            logger_1.default.info('🔍 Getting user info', {
                service: 'neuro-snap-backend',
                userId,
                inputParams: {
                    originalParams: { userId },
                    validation: {
                        userIdType: typeof userId,
                        userIdLength: userId?.length || 0,
                        isValidUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
                    }
                }
            });
            // 查询用户信息
            const startTime = Date.now();
            const { data: userData, error } = await client
                .from('user_survey')
                .select('*')
                .eq('id', userId)
                .single();
            const duration = Date.now() - startTime;
            const queryId = `get_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            if (userData) {
                this.dbLogger.logQuerySuccess(queryId, userData, startTime, {
                    table: 'user_survey',
                    operation: 'SELECT',
                    filters: { id: userId },
                    inputParams: {
                        requestedUserId: userId,
                        queryType: 'single_user_by_id',
                        expectedFields: ['id', 'name', 'gender', 'age', 'city', 'occupation', 'education', 'phone', 'submit_time']
                    }
                });
            }
            else if (error) {
                this.dbLogger.logQueryError(queryId, error, startTime, {
                    table: 'user_survey',
                    operation: 'SELECT',
                    filters: { id: userId },
                    inputParams: {
                        requestedUserId: userId,
                        queryType: 'single_user_by_id',
                        errorContext: 'User not found or database error'
                    }
                });
            }
            if (error) {
                logger_1.default.error('❌ Database query error', {
                    service: 'neuro-snap-backend',
                    userId,
                    error: error.message
                });
                return res.status(500).json({
                    error: '查询用户信息失败',
                    details: error.message
                });
            }
            if (!userData) {
                logger_1.default.warn('⚠️ User not found', {
                    service: 'neuro-snap-backend',
                    userId
                });
                return res.status(404).json({
                    error: '未找到用户信息',
                });
            }
            logger_1.default.info('✅ User info retrieved successfully', {
                service: 'neuro-snap-backend',
                userId: userData.id,
                name: userData.name
            });
            // 返回用户信息
            res.json({
                data: {
                    id: userData.id,
                    name: userData.name,
                    gender: userData.gender,
                    age: userData.age,
                    city: userData.city,
                    occupation: userData.occupation,
                    education: userData.education,
                    phone: userData.phone,
                    submit_time: userData.submit_time,
                },
            });
        }
        catch (error) {
            logger_1.default.error('💥 Error getting user info', {
                service: 'neuro-snap-backend',
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            res.status(500).json({
                error: error instanceof Error ? error.message : '获取用户信息时发生错误',
            });
        }
    }
}
exports.UserController = UserController;
