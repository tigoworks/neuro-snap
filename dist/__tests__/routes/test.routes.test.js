"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const test_routes_1 = __importDefault(require("../../routes/test.routes"));
const supabase_service_1 = require("../../services/supabase.service");
// 创建测试用的 Express 应用
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/test', test_routes_1.default);
describe('Test Routes', () => {
    let supabaseService;
    beforeAll(() => {
        // 获取 Supabase 服务实例
        supabaseService = supabase_service_1.SupabaseService.getInstance();
    });
    describe('GET /api/test/db', () => {
        it('should successfully connect to database and return data', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/test/db')
                .expect('Content-Type', /json/);
            // 检查响应状态和结构
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'success');
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
            // 如果返回了数据，检查数据结构
            if (response.body.data.length > 0) {
                const firstItem = response.body.data[0];
                expect(firstItem).toHaveProperty('id');
                expect(firstItem).toHaveProperty('content');
                expect(firstItem).toHaveProperty('metadata');
            }
        });
        it('should handle database connection errors gracefully', async () => {
            // 模拟数据库连接错误
            const mockError = new Error('Database connection failed');
            jest.spyOn(supabaseService, 'getClient').mockImplementationOnce(() => {
                throw mockError;
            });
            const response = await (0, supertest_1.default)(app)
                .get('/api/test/db')
                .expect('Content-Type', /json/);
            // 检查错误响应
            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('status', 'error');
            expect(response.body).toHaveProperty('message', '数据库连接失败');
            expect(response.body).toHaveProperty('error', mockError.message);
        });
        it('should handle empty database response', async () => {
            // 模拟空数据库响应
            jest.spyOn(supabaseService, 'getClient').mockImplementationOnce(() => ({
                from: () => ({
                    select: () => ({
                        data: [],
                        error: null
                    })
                })
            }));
            const response = await (0, supertest_1.default)(app)
                .get('/api/test/db')
                .expect('Content-Type', /json/);
            // 检查空数据响应
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'success');
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(0);
        });
    });
});
