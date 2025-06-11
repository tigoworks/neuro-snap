import '@jest/globals';
import request from 'supertest';
import express from 'express';
import surveyRoutes from '../../routes/survey.routes';
import { SupabaseService } from '../../services/supabase.service';
import logger from '../../utils/logger';

const app = express();
app.use(express.json());
app.use('/api/survey', surveyRoutes);

describe('Survey Routes', () => {
  let supabaseService: SupabaseService;

  beforeAll(() => {
    supabaseService = SupabaseService.getInstance();
  });

  describe('GET /api/survey/models', () => {
    it('should return all survey models', async () => {
      const response = await request(app)
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

      const response = await request(app)
        .get('/api/survey/models')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/survey/questions', () => {
    it('should return questions for a valid model', async () => {
      const response = await request(app)
        .get('/api/survey/questions?model=test_model')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('model');
      expect(response.body).toHaveProperty('questions');
      expect(Array.isArray(response.body.questions)).toBe(true);
    });

    it('should return 400 when model is not provided', async () => {
      const response = await request(app)
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
      } as any));

      const response = await request(app)
        .get('/api/survey/questions?model=non_existent_model')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Model not found');
    });
  });
}); 