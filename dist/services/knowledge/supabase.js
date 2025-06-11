"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseKnowledgeBase = void 0;
const logger_1 = __importDefault(require("../../utils/logger"));
class SupabaseKnowledgeBase {
    constructor(supabase) {
        this.supabase = supabase;
        logger_1.default.info('SupabaseKnowledgeBase initialized');
    }
    async getEntries(table) {
        try {
            logger_1.default.info(`Fetching entries from table: ${table}`);
            const { data, error } = await this.supabase
                .from(table)
                .select('*');
            if (error) {
                logger_1.default.error(`Supabase query error for table ${table}:`, error);
                throw error;
            }
            if (!data) {
                logger_1.default.warn(`No data found in table: ${table}`);
                return [];
            }
            logger_1.default.info(`Successfully fetched ${data.length} entries from ${table}`);
            return data.map(item => ({
                id: item.id,
                content: item.content,
                metadata: {
                    source: item.source || 'supabase',
                    table: table,
                    created_at: item.created_at,
                    updated_at: item.updated_at
                }
            }));
        }
        catch (error) {
            logger_1.default.error(`Error in getEntries for table ${table}:`, error);
            throw error;
        }
    }
    async addEntry(entry) {
        try {
            logger_1.default.info('Adding new entry to Supabase');
            const { data, error } = await this.supabase
                .from(entry.metadata.table)
                .insert([{
                    content: entry.content,
                    source: entry.metadata.source,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();
            if (error) {
                logger_1.default.error('Supabase insert error:', error);
                throw error;
            }
            if (!data) {
                throw new Error('No data returned after insert');
            }
            logger_1.default.info('Successfully added new entry');
            return {
                id: data.id,
                content: data.content,
                metadata: {
                    source: data.source || 'supabase',
                    table: entry.metadata.table,
                    created_at: data.created_at,
                    updated_at: data.updated_at
                }
            };
        }
        catch (error) {
            logger_1.default.error('Error in addEntry:', error);
            throw error;
        }
    }
    async search(query, table, limit = 10) {
        try {
            logger_1.default.info(`Searching in table ${table} with query: ${query}`);
            const { data, error } = await this.supabase
                .from(table)
                .select('*')
                .ilike('content', `%${query}%`)
                .limit(limit);
            if (error) {
                logger_1.default.error(`Supabase search error for table ${table}:`, error);
                throw error;
            }
            if (!data) {
                logger_1.default.warn(`No search results found in table: ${table}`);
                return [];
            }
            logger_1.default.info(`Found ${data.length} matching entries`);
            return data.map(item => ({
                id: item.id,
                content: item.content,
                metadata: {
                    source: item.source || 'supabase',
                    table: table,
                    created_at: item.created_at,
                    updated_at: item.updated_at
                }
            }));
        }
        catch (error) {
            logger_1.default.error(`Error in search for table ${table}:`, error);
            throw error;
        }
    }
    async updateEntry(id, entry) {
        const { data, error } = await this.supabase
            .from('knowledge_base')
            .update(entry)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return this.mapToKnowledgeEntry(data);
    }
    async deleteEntry(id) {
        const { error } = await this.supabase
            .from('knowledge_base')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
        return true;
    }
    async validateConfig() {
        try {
            await this.supabase.from('knowledge_base').select('count').limit(1);
            return true;
        }
        catch {
            return false;
        }
    }
    async getStatus() {
        try {
            const { count, error } = await this.supabase
                .from('knowledge_base')
                .select('*', { count: 'exact', head: true });
            if (error)
                throw error;
            return {
                status: 'available',
                entryCount: count || 0,
            };
        }
        catch (error) {
            return {
                status: 'unavailable',
                message: error instanceof Error ? error.message : 'Failed to connect to Supabase',
            };
        }
    }
    getConfig() {
        return { type: 'supabase' };
    }
    mapToKnowledgeEntry(data) {
        return {
            id: data.id,
            content: data.content,
            metadata: {
                ...data.metadata,
                created_at: data.created_at,
                updated_at: data.updated_at,
            },
        };
    }
}
exports.SupabaseKnowledgeBase = SupabaseKnowledgeBase;
