import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import logger from '../utils/logger';

export class SupabaseService {
  private static instance: SupabaseService;
  private client: SupabaseClient;

  private constructor() {
    this.client = supabase;
    logger.info('Supabase service initialized with plugin configuration');
  }

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  public getClient(): SupabaseClient {
    return this.client;
  }

  // 添加一些常用的数据库操作方法
  async getTableData<T = any>(table: string, query?: { [key: string]: any }) {
    try {
      let request = this.client.from(table).select('*');
      
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          request = request.eq(key, value);
        });
      }

      const { data, error } = await request;
      if (error) throw error;
      return data as T[];
    } catch (error) {
      logger.error(`Error fetching data from ${table}:`, error);
      throw error;
    }
  }

  async insertData<T = any>(table: string, data: Partial<T>) {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result as T;
    } catch (error) {
      logger.error(`Error inserting data into ${table}:`, error);
      throw error;
    }
  }

  async updateData<T = any>(table: string, id: string, data: Partial<T>) {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as T;
    } catch (error) {
      logger.error(`Error updating data in ${table}:`, error);
      throw error;
    }
  }

  async deleteData(table: string, id: string) {
    try {
      const { error } = await this.client
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error(`Error deleting data from ${table}:`, error);
      throw error;
    }
  }
}