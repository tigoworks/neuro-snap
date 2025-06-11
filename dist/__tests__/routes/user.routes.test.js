"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const user_routes_1 = __importDefault(require("../../routes/user.routes"));
const supabase_service_1 = require("../../services/supabase.service");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/user', user_routes_1.default);
describe('User Routes', () => {
    let supabaseService;
    beforeAll(() => {
        supabaseService = supabase_service_1.SupabaseService.getInstance();
    });
    describe('POST /api/user/info', () => {
        const validUserInfo = {
            name: 'Test User',
            gender: '男',
            age: '25',
            city: 'Beijing',
            occupation: 'Engineer',
            education: 'Bachelor',
            phone: '1234567890'
        };
        it('should successfully save user info', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/user/info')
                .send(validUserInfo)
                .expect('Content-Type', /json/);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('name', validUserInfo.name);
            expect(response.body.data).toHaveProperty('gender', 'male');
            expect(response.body.data).toHaveProperty('age', 25);
        });
        it('should handle missing required fields', async () => {
            const invalidUserInfo = {
                name: 'Test User',
                // 缺少必填字段
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/user/info')
                .send(invalidUserInfo)
                .expect('Content-Type', /json/);
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
        it('should handle database errors', async () => {
            jest.spyOn(supabaseService, 'getClient').mockImplementationOnce(() => {
                throw new Error('Database error');
            });
            const response = await (0, supertest_1.default)(app)
                .post('/api/user/info')
                .send(validUserInfo)
                .expect('Content-Type', /json/);
            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
        });
    });
    describe('GET /api/user/info/:userId', () => {
        it('should return user info for valid userId', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/user/info/test_user_id')
                .expect('Content-Type', /json/);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('name');
        });
        it('should return 404 for non-existent user', async () => {
            // 模拟空数据响应
            jest.spyOn(supabaseService, 'getClient').mockImplementationOnce(() => ({
                from: () => ({
                    select: () => ({
                        data: [],
                        error: null
                    })
                })
            }));
            const response = await (0, supertest_1.default)(app)
                .get('/api/user/info/non_existent_user')
                .expect('Content-Type', /json/);
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error', '未找到用户信息');
        });
        it('should handle database errors', async () => {
            jest.spyOn(supabaseService, 'getClient').mockImplementationOnce(() => {
                throw new Error('Database error');
            });
            const response = await (0, supertest_1.default)(app)
                .get('/api/user/info/test_user_id')
                .expect('Content-Type', /json/);
            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
        });
    });
});
