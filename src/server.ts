import { config as dotenvConfig } from 'dotenv';
import app from './app';
import appConfig from './config';
import { SupabaseService } from './services/supabase.service';
import logger from './utils/logger';

// 加载 .env.local 文件
dotenvConfig({ path: '.env.local' });

const port = appConfig.port;

// 初始化 Supabase 服务
try {
  SupabaseService.getInstance();
  logger.info('Supabase service initialized successfully');
} catch (error) {
  logger.error(`Failed to initialize Supabase service: ${error instanceof Error ? error.message : 'Unknown error'}`);
  process.exit(1);
}

const server = app.listen(port, () => {
  logger.info(`Server is running on port ${port} in ${appConfig.env} environment`);
});

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