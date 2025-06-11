export interface UserSurvey {
  id: string;
  user_id: string;
  created_at: string;
  model_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface UserRawAnswer {
  id: string;
  survey_id: string;
  question_id: string;
  model_type: string;
  option_id: string;
  option_value: number;
  text_value?: string;
  created_at: string;
}

export interface KnowledgeBase {
  id: string;
  model_type: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface AnalysisResult {
  id: string;
  user_id: string;
  model_type: string;
  analysis: any;
  summary: string;
  created_at: string;
  knowledge_sources?: string[];
  ai_provider?: string;
}

export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface TestModel {
  id: string;
  name: string;
  description: string;
  question_count: number;
  created_at: string;
  updated_at: string;
}

export interface AnalysisRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
}

export interface AnalysisResponse {
  success: boolean;
  result?: string;
  error?: string;
  metadata?: {
    model: string;
    tokens_used?: number;
    finish_reason?: string;
  };
}

export interface BaseConfig {
  enabled: boolean;
  name: string;
  description?: string;
}

export interface AIServiceConfig {
  provider: 'openai' | 'anthropic' | 'azure';
  api_key: string;
  organization_id?: string;
  model: string;
  temperature?: number;
  max_tokens?: number;
}

export interface KnowledgeBaseConfig {
  type: 'supabase';
}

export interface KnowledgeEntry {
  id: string;
  content: string;
  metadata: {
    source: string;
    table: string;
    created_at: string;
    updated_at: string;
  };
}

export interface DatabaseConfig {
  url: string;
  key: string;
}

export interface AppConfig {
  port: number;
  node_env: string;
  cors_origin: string;
  rate_limit: number;
  ai_services: Record<string, AIServiceConfig>;
  knowledge_bases: Record<string, KnowledgeBaseConfig>;
  database: {
    url: string;
    key: string;
  };
} 