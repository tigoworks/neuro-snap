"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseKnowledgeBase = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
class SupabaseKnowledgeBase {
    constructor(supabase) {
        this.supabase = supabase;
    }
    async getEntries(tableName) {
        try {
            logger_1.default.info(`Attempting to fetch entries from table: ${tableName}`);
            const { data, error } = await this.supabase
                .from(tableName)
                .select('*');
            if (error) {
                logger_1.default.error(`Error fetching entries from Supabase: ${error.message}`);
                throw error;
            }
            logger_1.default.info(`Successfully fetched ${data.length} entries from ${tableName}`);
            return data.map(item => ({
                id: item.id,
                content: JSON.stringify(item),
                metadata: {
                    source: 'supabase',
                    table: tableName,
                    created_at: item.created_at,
                    updated_at: item.updated_at
                }
            }));
        }
        catch (error) {
            logger_1.default.error(`Error in getEntries: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
    async addEntry(tableName, entry) {
        try {
            logger_1.default.info(`Attempting to add entry to table: ${tableName}`);
            const { data, error } = await this.supabase
                .from(tableName)
                .insert(entry)
                .select()
                .single();
            if (error) {
                logger_1.default.error(`Error adding entry to Supabase: ${error.message}`);
                throw error;
            }
            logger_1.default.info(`Successfully added entry to ${tableName}`);
            return {
                id: data.id,
                content: JSON.stringify(data),
                metadata: {
                    source: 'supabase',
                    table: tableName,
                    created_at: data.created_at,
                    updated_at: data.updated_at
                }
            };
        }
        catch (error) {
            logger_1.default.error(`Error in addEntry: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
}
exports.SupabaseKnowledgeBase = SupabaseKnowledgeBase;
