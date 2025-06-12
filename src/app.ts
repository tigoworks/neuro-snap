import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
// import analysisRoutes from './routes/analysis.routes';
import simpleAnalysisRoutes from './routes/simple-analysis.routes';
import userRoutes from './routes/user.routes';
import surveyRoutes from './routes/survey.routes';
import answerRoutes from './routes/answer.routes';
import configRoutes from './routes/config.routes';
import testRoutes from './routes/test.routes';
import apiRoutes from './routes/api.routes';
import authRoutes from './routes/auth.routes';
import knowledgeRoutes from './routes/knowledge.routes';
import errorMiddleware from './middleware/error.middleware';
import { requestLogger } from './middleware/request-logger.middleware';
import config from './config';
import logger from './utils/logger';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors_origin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Frontend-Key',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 添加压缩中间件
app.use(compression());

// Enhanced request logging middleware
app.use(requestLogger.logRequest);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    version: '1.0.0'
  });
});

// Routes
// Authentication routes
app.use('/api/auth', authRoutes);

// Frontend-compatible API routes (priority)
app.use('/api', apiRoutes);

// Original backend routes (for backward compatibility)
// app.use('/api/analyze', analysisRoutes);  // 暂时注释掉有问题的AI分析路由
app.use('/api/analysis', simpleAnalysisRoutes); // 新的基础分析系统
app.use('/api/knowledge', knowledgeRoutes); // 知识库管理系统
app.use('/api/user', userRoutes);
app.use('/api/survey', surveyRoutes);
app.use('/api/answer', answerRoutes);
app.use('/api/config', configRoutes);
app.use('/api/test', testRoutes);

// Error handling
app.use(errorMiddleware.notFoundHandler);
app.use(requestLogger.logError); // 错误日志记录
app.use(errorMiddleware.errorHandler);

export default app; 