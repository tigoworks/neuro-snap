import { AIService } from './ai/base';
import { KnowledgeBase } from './knowledge/base';
import { OpenAIService } from './ai/openai';
import { SupabaseKnowledgeBase } from './knowledge/supabase';
import { AIServiceConfig, KnowledgeBaseConfig } from '../types';
import { SupabaseService } from './supabase.service';
import logger from '../utils/logger';

export class ServiceFactory {
  private static aiServices: Map<string, AIService> = new Map();
  private static knowledgeBases: Map<string, KnowledgeBase> = new Map();

  static createAIService(config: AIServiceConfig): AIService {
    const key = `${config.provider}:${config.model}`;
    
    if (this.aiServices.has(key)) {
      return this.aiServices.get(key)!;
    }

    let service: AIService;
    switch (config.provider) {
      case 'openai':
        service = new OpenAIService(config);
        break;
      // Add other AI service providers here
      default:
        throw new Error(`Unsupported AI service provider: ${config.provider}`);
    }

    this.aiServices.set(key, service);
    return service;
  }

  static createKnowledgeBase(config: KnowledgeBaseConfig): KnowledgeBase {
    const key = `${config.type}:${config.database}`;
    
    if (this.knowledgeBases.has(key)) {
      return this.knowledgeBases.get(key)!;
    }

    if (config.type === 'supabase') {
      try {
        const supabase = SupabaseService.getInstance().getClient();
        logger.info('Using global Supabase client');
        return new SupabaseKnowledgeBase(supabase);
      } catch (error) {
        logger.error(`Failed to create Supabase knowledge base: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    }
    throw new Error(`Unsupported knowledge base type: ${config.type}`);
  }

  static getAIService(provider: string, model: string): AIService | undefined {
    return this.aiServices.get(`${provider}:${model}`);
  }

  static getKnowledgeBase(type: string, database: string): KnowledgeBase | undefined {
    return this.knowledgeBases.get(`${type}:${database}`);
  }

  static async validateAllServices(): Promise<{
    aiServices: Record<string, boolean>;
    knowledgeBases: Record<string, boolean>;
  }> {
    const results = {
      aiServices: {} as Record<string, boolean>,
      knowledgeBases: {} as Record<string, boolean>,
    };

    for (const [key, service] of this.aiServices.entries()) {
      results.aiServices[key] = await service.validateConfig();
    }

    for (const [key, kb] of this.knowledgeBases.entries()) {
      results.knowledgeBases[key] = await kb.validateConfig();
    }

    return results;
  }
} 