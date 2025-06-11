import { KnowledgeEntry, KnowledgeBaseConfig } from '../../types';

export interface KnowledgeBase {
  // 获取知识条目
  getEntries(modelTag: string): Promise<KnowledgeEntry[]>;
  
  // 搜索相关知识
  search(query: string, modelTag: string, limit?: number): Promise<KnowledgeEntry[]>;
  
  // 添加知识条目
  addEntry(entry: Omit<KnowledgeEntry, 'id' | 'created_at' | 'updated_at'>): Promise<KnowledgeEntry>;
  
  // 更新知识条目
  updateEntry(id: string, entry: Partial<KnowledgeEntry>): Promise<KnowledgeEntry>;
  
  // 删除知识条目
  deleteEntry(id: string): Promise<boolean>;
  
  // 获取知识库配置
  getConfig(): KnowledgeBaseConfig;
  
  // 验证知识库配置
  validateConfig(): Promise<boolean>;
  
  // 获取知识库状态
  getStatus(): Promise<{
    status: 'available' | 'unavailable';
    message?: string;
    entryCount?: number;
  }>;
} 