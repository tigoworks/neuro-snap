"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIService = void 0;
const openai_1 = __importDefault(require("openai"));
class OpenAIService {
    constructor(config) {
        this.config = config;
        this.client = new openai_1.default({
            apiKey: config.api_key,
            organization: config.organization_id,
        });
    }
    async analyze(request) {
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
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
    async getStatus() {
        try {
            await this.client.models.list();
            return { status: 'available' };
        }
        catch (error) {
            return {
                status: 'unavailable',
                message: error instanceof Error ? error.message : 'Failed to connect to OpenAI',
            };
        }
    }
    getConfig() {
        return {
            ...this.config,
            api_key: '***', // Hide sensitive information
        };
    }
    async validateConfig() {
        try {
            const status = await this.getStatus();
            return status.status === 'available';
        }
        catch {
            return false;
        }
    }
}
exports.OpenAIService = OpenAIService;
