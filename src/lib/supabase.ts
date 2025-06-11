import { createClient } from '@supabase/supabase-js';
import logger from '../utils/logger';

if (!process.env.SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!process.env.SUPABASE_KEY) {
  throw new Error('Missing SUPABASE_KEY environment variable');
}

// 创建 Supabase 客户端
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'public'
    }
  }
);

// 测试连接
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('survey_model').select('count').limit(1);
    if (error) throw error;
    logger.info('Supabase connection test successful');
    return true;
  } catch (error) {
    logger.error('Supabase connection test failed:', error);
    return false;
  }
}

// 导出类型
export type { SupabaseClient } from '@supabase/supabase-js'; 