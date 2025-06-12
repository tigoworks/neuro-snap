"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceFactory = void 0;
const openai_1 = require("./ai/openai");
const supabase_1 = require("./knowledge/supabase");
const supabase_service_1 = require("./supabase.service");
const logger_1 = __importDefault(require("../utils/logger"));
class ServiceFactory {
    static createAIService(config) {
        const key = `${config.provider}:${config.model}`;
        if (this.aiServices.has(key)) {
            return this.aiServices.get(key);
        }
        let service;
        switch (config.provider) {
            case 'openai':
                service = new openai_1.OpenAIService(config);
                break;
            // Add other AI service providers here
            default:
                throw new Error(`Unsupported AI service provider: ${config.provider}`);
        }
        this.aiServices.set(key, service);
        return service;
    }
    static createKnowledgeBase(config) {
        const key = `${config.type}:${config.database}`;
        if (this.knowledgeBases.has(key)) {
            return this.knowledgeBases.get(key);
        }
        if (config.type === 'supabase') {
            try {
                const supabase = supabase_service_1.SupabaseService.getInstance().getClient();
                logger_1.default.info('Using global Supabase client');
                return new supabase_1.SupabaseKnowledgeBase(supabase);
            }
            catch (error) {
                logger_1.default.error(`Failed to create Supabase knowledge base: ${error instanceof Error ? error.message : 'Unknown error'}`);
                throw error;
            }
        }
        throw new Error(`Unsupported knowledge base type: ${config.type}`);
    }
    static getAIService(provider, model) {
        return this.aiServices.get(`${provider}:${model}`);
    }
    static getKnowledgeBase(type, database) {
        return this.knowledgeBases.get(`${type}:${database}`);
    }
    static async validateAllServices() {
        const results = {
            aiServices: {},
            knowledgeBases: {},
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
exports.ServiceFactory = ServiceFactory;
ServiceFactory.aiServices = new Map();
ServiceFactory.knowledgeBases = new Map();
