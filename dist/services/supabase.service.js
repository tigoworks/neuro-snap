"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseService = void 0;
const supabase_1 = require("../lib/supabase");
const logger_1 = __importDefault(require("../utils/logger"));
class SupabaseService {
    constructor() {
        this.client = supabase_1.supabase;
        logger_1.default.info('Supabase service initialized with plugin configuration');
    }
    static getInstance() {
        if (!SupabaseService.instance) {
            SupabaseService.instance = new SupabaseService();
        }
        return SupabaseService.instance;
    }
    getClient() {
        return this.client;
    }
    // 添加一些常用的数据库操作方法
    async getTableData(table, query) {
        try {
            let request = this.client.from(table).select('*');
            if (query) {
                Object.entries(query).forEach(([key, value]) => {
                    request = request.eq(key, value);
                });
            }
            const { data, error } = await request;
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            logger_1.default.error(`Error fetching data from ${table}:`, error);
            throw error;
        }
    }
    async insertData(table, data) {
        try {
            const { data: result, error } = await this.client
                .from(table)
                .insert(data)
                .select()
                .single();
            if (error)
                throw error;
            return result;
        }
        catch (error) {
            logger_1.default.error(`Error inserting data into ${table}:`, error);
            throw error;
        }
    }
    async updateData(table, id, data) {
        try {
            const { data: result, error } = await this.client
                .from(table)
                .update(data)
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            return result;
        }
        catch (error) {
            logger_1.default.error(`Error updating data in ${table}:`, error);
            throw error;
        }
    }
    async deleteData(table, id) {
        try {
            const { error } = await this.client
                .from(table)
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            return true;
        }
        catch (error) {
            logger_1.default.error(`Error deleting data from ${table}:`, error);
            throw error;
        }
    }
}
exports.SupabaseService = SupabaseService;
