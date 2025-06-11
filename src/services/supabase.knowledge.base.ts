import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { KnowledgeEntry } from '../types';
import logger from '../utils/logger';

export class SupabaseKnowledgeBase {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async getEntries(tableName: string): Promise<KnowledgeEntry[]> {
    try {
      logger.info(`Attempting to fetch entries from table: ${tableName}`);
      
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*');

      if (error) {
        logger.error(`Error fetching entries from Supabase: ${error.message}`);
        throw error;
      }

      logger.info(`Successfully fetched ${data.length} entries from ${tableName}`);

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
    } catch (error) {
      logger.error(`Error in getEntries: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async addEntry(tableName: string, entry: any): Promise<KnowledgeEntry> {
    try {
      logger.info(`Attempting to add entry to table: ${tableName}`);
      
      const { data, error } = await this.supabase
        .from(tableName)
        .insert(entry)
        .select()
        .single();

      if (error) {
        logger.error(`Error adding entry to Supabase: ${error.message}`);
        throw error;
      }

      logger.info(`Successfully added entry to ${tableName}`);

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
    } catch (error) {
      logger.error(`Error in addEntry: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
} 