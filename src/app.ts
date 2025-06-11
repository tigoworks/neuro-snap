import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import analysisRoutes from './routes/analysis.routes';
import userRoutes from './routes/user.routes';
import surveyRoutes from './routes/survey.routes';
import answerRoutes from './routes/answer.routes';
import configRoutes from './routes/config.routes';
import testRoutes from './routes/test.routes';
import apiRoutes from './routes/api.routes';
import authRoutes from './routes/auth.routes';
import errorMiddleware from './middleware/error.middleware';
import config from './config';
import logger from './utils/logger';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors_origin,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
// Authentication routes
app.use('/api/auth', authRoutes);

// Frontend-compatible API routes (priority)
app.use('/api', apiRoutes);

// Original backend routes (for backward compatibility)
app.use('/api/analyze', analysisRoutes);
app.use('/api/user', userRoutes);
app.use('/api/survey', surveyRoutes);
app.use('/api/answer', answerRoutes);
app.use('/api/config', configRoutes);
app.use('/api/test', testRoutes);

// Error handling
app.use(errorMiddleware.notFoundHandler);
app.use(errorMiddleware.errorHandler);

export default app; 