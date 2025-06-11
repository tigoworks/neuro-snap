import { SupabaseClient } from '@supabase/supabase-js';
import { KnowledgeBase } from './base';
import { KnowledgeEntry } from '../../types';
import logger from '../../utils/logger';

export class SupabaseKnowledgeBase implements KnowledgeBase {
  constructor(private readonly supabase: SupabaseClient) {
    logger.info('SupabaseKnowledgeBase initialized');
  }

  async getEntries(table: string): Promise<KnowledgeEntry[]> {
    try {
      logger.info(`Fetching entries from table: ${table}`);
      const { data, error } = await this.supabase
        .from(table)
        .select('*');

      if (error) {
        logger.error(`Supabase query error for table ${table}:`, error);
        throw error;
      }

      if (!data) {
        logger.warn(`No data found in table: ${table}`);
        return [];
      }

      logger.info(`Successfully fetched ${data.length} entries from ${table}`);
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
    } catch (error) {
      logger.error(`Error in getEntries for table ${table}:`, error);
      throw error;
    }
  }

  async addEntry(entry: Omit<KnowledgeEntry, 'id' | 'created_at' | 'updated_at'>): Promise<KnowledgeEntry> {
    try {
      logger.info('Adding new entry to Supabase');
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
        logger.error('Supabase insert error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned after insert');
      }

      logger.info('Successfully added new entry');
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
    } catch (error) {
      logger.error('Error in addEntry:', error);
      throw error;
    }
  }

  async search(query: string, table: string, limit: number = 10): Promise<KnowledgeEntry[]> {
    try {
      logger.info(`Searching in table ${table} with query: ${query}`);
      const { data, error } = await this.supabase
        .from(table)
        .select('*')
        .ilike('content', `%${query}%`)
        .limit(limit);

      if (error) {
        logger.error(`Supabase search error for table ${table}:`, error);
        throw error;
      }

      if (!data) {
        logger.warn(`No search results found in table: ${table}`);
        return [];
      }

      logger.info(`Found ${data.length} matching entries`);
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
    } catch (error) {
      logger.error(`Error in search for table ${table}:`, error);
      throw error;
    }
  }

  async updateEntry(id: string, entry: Partial<KnowledgeEntry>): Promise<KnowledgeEntry> {
    const { data, error } = await this.supabase
      .from('knowledge_base')
      .update(entry)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToKnowledgeEntry(data);
  }

  async deleteEntry(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('knowledge_base')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  async validateConfig(): Promise<boolean> {
    try {
      await this.supabase.from('knowledge_base').select('count').limit(1);
      return true;
    } catch {
      return false;
    }
  }

  async getStatus(): Promise<{
    status: 'available' | 'unavailable';
    message?: string;
    entryCount?: number;
  }> {
    try {
      const { count, error } = await this.supabase
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      return {
        status: 'available',
        entryCount: count || 0,
      };
    } catch (error) {
      return {
        status: 'unavailable',
        message: error instanceof Error ? error.message : 'Failed to connect to Supabase',
      };
    }
  }

  getConfig() {
    return { type: 'supabase' as const };
  }

  private mapToKnowledgeEntry(data: any): KnowledgeEntry {
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