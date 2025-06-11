import { Router } from 'express';
import config from '../config';

const router = Router();

// 配置检查路由（仅在开发环境可用）
if (config.env === 'development') {
  router.get('/check', (req, res) => {
    res.json({
      env: config.env,
      supabase: {
        url: config.supabase.url ? '已配置' : '未配置',
        key: config.supabase.key ? '已配置' : '未配置',
        connection_string: config.supabase.connection_string ? '已配置' : '未配置',
        database: config.supabase.database ? '已配置' : '未配置',
      },
      openai: {
        api_key: config.openai.api_key ? '已配置' : '未配置',
        organization_id: config.openai.organization_id ? '已配置' : '未配置',
      },
    });
  });
}

export default router; 