import { AnalysisRequest, AnalysisResponse } from '../../types';

export interface AIService {
  // 分析用户回答
  analyze(request: AnalysisRequest): Promise<AnalysisResponse>;
  
  // 获取服务状态
  getStatus(): Promise<{
    status: 'available' | 'unavailable';
    message?: string;
  }>;
  
  // 获取服务配置
  getConfig(): Record<string, any>;
  
  // 验证服务配置
  validateConfig(): Promise<boolean>;
} 