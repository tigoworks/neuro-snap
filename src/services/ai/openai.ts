import OpenAI from 'openai';
import { AIService } from './base';
import { AnalysisRequest, AnalysisResponse, AIServiceConfig } from '../../types';

export class OpenAIService implements AIService {
  private client: OpenAI;
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.api_key,
      organization: config.organization_id,
    });
  }

  async analyze(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      const { model, messages, temperature = 0.7, max_tokens = 2000 } = request;

      const completion = await this.client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return {
        success: true,
        result: response,
        metadata: {
          model,
          tokens_used: completion.usage?.total_tokens,
          finish_reason: completion.choices[0]?.finish_reason,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getStatus(): Promise<{ status: 'available' | 'unavailable'; message?: string }> {
    try {
      await this.client.models.list();
      return { status: 'available' };
    } catch (error) {
      return {
        status: 'unavailable',
        message: error instanceof Error ? error.message : 'Failed to connect to OpenAI',
      };
    }
  }

  getConfig(): Record<string, any> {
    return {
      ...this.config,
      api_key: '***', // Hide sensitive information
    };
  }

  async validateConfig(): Promise<boolean> {
    try {
      const status = await this.getStatus();
      return status.status === 'available';
    } catch {
      return false;
    }
  }
} 