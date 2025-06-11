import { config as dotenvConfig } from 'dotenv';
import express from 'express';
import appConfig from './config';
import { SupabaseService } from './services/supabase.service';
import logger from './utils/logger';

// 加载 .env.local 文件
dotenvConfig({ path: '.env.local' });

const app = express();
const port = appConfig.port;
const server = app.listen(port, () => {
  logger.info(`Server is running on port ${port} in ${appConfig.env} environment`);
});

// 初始化 Supabase 服务
try {
  SupabaseService.getInstance();
  logger.info('Supabase service initialized successfully');
} catch (error) {
  logger.error(`Failed to initialize Supabase service: ${error instanceof Error ? error.message : 'Unknown error'}`);
  process.exit(1);
}

// 中间件
app.use(express.json());

// 路由
app.use('/api/test', require('./routes/test.routes').default);
app.use('/api/survey', require('./routes/survey.routes').default);
app.use('/api/user', require('./routes/user.routes').default);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app; 