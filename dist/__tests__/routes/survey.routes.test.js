"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const survey_routes_1 = __importDefault(require("../../routes/survey.routes"));
const supabase_service_1 = require("../../services/supabase.service");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/survey', survey_routes_1.default);
describe('Survey Routes', () => {
    let supabaseService;
    beforeAll(() => {
        supabaseService = supabase_service_1.SupabaseService.getInstance();
    });
    describe('GET /api/survey/models', () => {
        it('should return all survey models', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/survey/models')
                .expect('Content-Type', /json/);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('models');
            expect(Array.isArray(response.body.models)).toBe(true);
        });
        it('should handle database errors when fetching models', async () => {
            // 模拟数据库错误
            jest.spyOn(supabaseService, 'getClient').mockImplementationOnce(() => {
                throw new Error('Database error');
            });
            const response = await (0, supertest_1.default)(app)
                .get('/api/survey/models')
                .expect('Content-Type', /json/);
            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
        });
    });
    describe('GET /api/survey/questions', () => {
        it('should return questions for a valid model', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/survey/questions?model=test_model')
                .expect('Content-Type', /json/);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('model');
            expect(response.body).toHaveProperty('questions');
            expect(Array.isArray(response.body.questions)).toBe(true);
        });
        it('should return 400 when model is not provided', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/survey/questions')
                .expect('Content-Type', /json/);
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Model code is required');
        });
        it('should return 404 when model is not found', async () => {
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
                .get('/api/survey/questions?model=non_existent_model')
                .expect('Content-Type', /json/);
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error', 'Model not found');
        });
    });
});
