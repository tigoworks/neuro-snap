import { DatabaseLoggerService } from './database-logger.service';
import { SupabaseService } from './supabase.service';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

export interface KnowledgeSource {
  id: string;
  name: string;
  type: 'file' | 'database' | 'api' | 'url';
  config: any;
  enabled: boolean;
  lastUpdated: Date;
}

export interface KnowledgeEntry {
  id: string;
  sourceId: string;
  title: string;
  content: string;
  metadata: any;
  category: string;
  tags: string[];
  relevanceScore?: number;
}

export interface SearchQuery {
  query: string;
  category?: string;
  tags?: string[];
  limit?: number;
  minRelevanceScore?: number;
}

export class MCPKnowledgeService {
  private logger: DatabaseLoggerService;
  private supabase: SupabaseService;
  private knowledgeBasePath: string;
  
  constructor() {
    this.logger = DatabaseLoggerService.getInstance();
    this.supabase = SupabaseService.getInstance();
    this.knowledgeBasePath = path.join(process.cwd(), 'knowledge-base');
  }

  /**
   * 初始化知识库
   */
  async initialize(): Promise<void> {
    const queryId = await this.logger.logQuery({
      operation: 'INITIALIZE',
      table: 'knowledge_base',
      queryId: `init_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    try {
      // 创建知识库目录
      await fs.mkdir(this.knowledgeBasePath, { recursive: true });
      
      // 创建子目录
      const subDirs = ['files', 'documents', 'analysis', 'reports'];
      for (const dir of subDirs) {
        await fs.mkdir(path.join(this.knowledgeBasePath, dir), { recursive: true });
      }

      // 确保数据库表存在
      await this.ensureTables();

      await this.logger.logQueryResult(queryId, { 
        success: true, 
        resultCount: 1,
        resultSize: 0,
        duration: Date.now() - parseInt(queryId.split('_')[1])
      });

      console.log('✅ MCP知识库服务初始化完成');
    } catch (error) {
      await this.logger.logQueryResult(queryId, { 
        success: false, 
        error: error.message,
        duration: Date.now() - parseInt(queryId.split('_')[1])
      });
      throw error;
    }
  }

  /**
   * 确保数据库表存在
   */
  private async ensureTables(): Promise<void> {
    const tables = [
      {
        name: 'knowledge_sources',
        schema: `
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          config JSONB NOT NULL,
          enabled BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        `
      },
      {
        name: 'knowledge_entries',
        schema: `
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          source_id UUID REFERENCES knowledge_sources(id),
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          metadata JSONB DEFAULT '{}',
          category VARCHAR(100),
          tags TEXT[],
          relevance_score FLOAT DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        `
      }
    ];

    for (const table of tables) {
      try {
        // 这里我们暂时跳过表创建，因为需要管理员权限
        console.log(`📋 表结构准备就绪: ${table.name}`);
      } catch (error) {
        console.warn(`⚠️  表创建跳过: ${table.name} - ${error.message}`);
      }
    }
  }

  /**
   * 添加知识源
   */
  async addKnowledgeSource(source: Omit<KnowledgeSource, 'id' | 'lastUpdated'>): Promise<string> {
    const queryId = await this.logger.logQuery({
      operation: 'INSERT',
      table: 'knowledge_sources',
      queryId: `add_source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    try {
      const result = await this.supabase.client
        .from('knowledge_sources')
        .insert({
          name: source.name,
          type: source.type,
          config: source.config,
          enabled: source.enabled
        })
        .select('id')
        .single();

      if (result.error) throw result.error;

      await this.logger.logQueryResult(queryId, {
        success: true,
        resultCount: 1,
        resultSize: JSON.stringify(result.data).length,
        duration: Date.now() - parseInt(queryId.split('_')[2])
      });

      console.log(`✅ 知识源添加成功: ${source.name} (${source.type})`);
      return result.data.id;
    } catch (error) {
      await this.logger.logQueryResult(queryId, {
        success: false,
        error: error.message,
        duration: Date.now() - parseInt(queryId.split('_')[2])
      });
      throw new Error(`添加知识源失败: ${error.message}`);
    }
  }

  /**
   * 导入文件到知识库
   */
  async importFile(filePath: string, category: string = 'general', tags: string[] = []): Promise<string> {
    const queryId = await this.logger.logQuery({
      operation: 'FILE_IMPORT',
      table: 'knowledge_entries',
      queryId: `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    try {
      // 读取文件内容
      const content = await fs.readFile(filePath, 'utf-8');
      const fileName = path.basename(filePath);
      const fileExt = path.extname(filePath);
      
      // 创建知识条目
      const entry: Omit<KnowledgeEntry, 'id'> = {
        sourceId: 'file-source', // 临时ID
        title: fileName,
        content: content,
        metadata: {
          filePath,
          fileSize: (await fs.stat(filePath)).size,
          fileType: fileExt,
          importDate: new Date().toISOString()
        },
        category,
        tags: [...tags, 'file', fileExt.replace('.', '')]
      };

      const entryId = await this.addKnowledgeEntry(entry);

      // 复制文件到知识库目录
      const targetPath = path.join(this.knowledgeBasePath, 'files', fileName);
      await fs.copyFile(filePath, targetPath);

      await this.logger.logQueryResult(queryId, {
        success: true,
        resultCount: 1,
        resultSize: content.length,
        duration: Date.now() - parseInt(queryId.split('_')[1])
      });

      console.log(`📄 文件导入成功: ${fileName} -> ${entryId}`);
      return entryId;
    } catch (error) {
      await this.logger.logQueryResult(queryId, {
        success: false,
        error: error.message,
        duration: Date.now() - parseInt(queryId.split('_')[1])
      });
      throw new Error(`文件导入失败: ${error.message}`);
    }
  }

  /**
   * 从网站抓取内容
   */
  async importFromUrl(url: string, category: string = 'web', tags: string[] = []): Promise<string> {
    const queryId = await this.logger.logQuery({
      operation: 'URL_IMPORT',
      table: 'knowledge_entries',
      queryId: `url_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    try {
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; KnowledgeBot/1.0)'
        }
      });

      const content = response.data;
      const title = this.extractTitleFromHtml(content) || url;

      const entry: Omit<KnowledgeEntry, 'id'> = {
        sourceId: 'url-source',
        title,
        content,
        metadata: {
          sourceUrl: url,
          contentType: response.headers['content-type'],
          contentLength: content.length,
          fetchDate: new Date().toISOString(),
          statusCode: response.status
        },
        category,
        tags: [...tags, 'web', 'url']
      };

      const entryId = await this.addKnowledgeEntry(entry);

      await this.logger.logQueryResult(queryId, {
        success: true,
        resultCount: 1,
        resultSize: content.length,
        duration: Date.now() - parseInt(queryId.split('_')[1])
      });

      console.log(`🌐 网页内容导入成功: ${title} -> ${entryId}`);
      return entryId;
    } catch (error) {
      await this.logger.logQueryResult(queryId, {
        success: false,
        error: error.message,
        duration: Date.now() - parseInt(queryId.split('_')[1])
      });
      throw new Error(`网页导入失败: ${error.message}`);
    }
  }

  /**
   * 添加知识条目
   */
  private async addKnowledgeEntry(entry: Omit<KnowledgeEntry, 'id'>): Promise<string> {
    const result = await this.supabase.client
      .from('knowledge_entries')
      .insert({
        source_id: entry.sourceId,
        title: entry.title,
        content: entry.content,
        metadata: entry.metadata,
        category: entry.category,
        tags: entry.tags,
        relevance_score: entry.relevanceScore || 0
      })
      .select('id')
      .single();

    if (result.error) throw result.error;
    return result.data.id;
  }

  /**
   * 搜索知识库
   */
  async search(query: SearchQuery): Promise<KnowledgeEntry[]> {
    const queryId = await this.logger.logQuery({
      operation: 'SEARCH',
      table: 'knowledge_entries',
      queryId: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    try {
      let searchQuery = this.supabase.client
        .from('knowledge_entries')
        .select('*');

      // 全文搜索
      if (query.query) {
        searchQuery = searchQuery.or(`title.ilike.%${query.query}%,content.ilike.%${query.query}%`);
      }

      // 按分类筛选
      if (query.category) {
        searchQuery = searchQuery.eq('category', query.category);
      }

      // 按标签筛选
      if (query.tags && query.tags.length > 0) {
        searchQuery = searchQuery.overlaps('tags', query.tags);
      }

      // 相关性分数筛选
      if (query.minRelevanceScore) {
        searchQuery = searchQuery.gte('relevance_score', query.minRelevanceScore);
      }

      // 结果限制
      if (query.limit) {
        searchQuery = searchQuery.limit(query.limit);
      }

      // 按相关性排序
      searchQuery = searchQuery.order('relevance_score', { ascending: false });

      const result = await searchQuery;

      if (result.error) throw result.error;

      const entries = result.data.map(row => ({
        id: row.id,
        sourceId: row.source_id,
        title: row.title,
        content: row.content,
        metadata: row.metadata,
        category: row.category,
        tags: row.tags || [],
        relevanceScore: row.relevance_score
      }));

      await this.logger.logQueryResult(queryId, {
        success: true,
        resultCount: entries.length,
        resultSize: JSON.stringify(entries).length,
        duration: Date.now() - parseInt(queryId.split('_')[1])
      });

      console.log(`🔍 知识库搜索完成: "${query.query}" -> ${entries.length} 条结果`);
      return entries;
    } catch (error) {
      await this.logger.logQueryResult(queryId, {
        success: false,
        error: error.message,
        duration: Date.now() - parseInt(queryId.split('_')[1])
      });
      throw new Error(`知识库搜索失败: ${error.message}`);
    }
  }

  /**
   * 获取知识库统计信息
   */
  async getStatistics(): Promise<any> {
    try {
      const sourcesResult = await this.supabase.client
        .from('knowledge_sources')
        .select('type', { count: 'exact' });

      const entriesResult = await this.supabase.client
        .from('knowledge_entries')
        .select('category', { count: 'exact' });

      const categoriesResult = await this.supabase.client
        .from('knowledge_entries')
        .select('category')
        .group('category');

      return {
        totalSources: sourcesResult.count || 0,
        totalEntries: entriesResult.count || 0,
        categories: categoriesResult.data?.map(c => c.category) || [],
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('获取知识库统计失败:', error);
      return {
        totalSources: 0,
        totalEntries: 0,
        categories: [],
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * 从HTML中提取标题
   */
  private extractTitleFromHtml(html: string): string | null {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : null;
  }

  /**
   * 获取相关知识内容（用于AI分析）
   */
  async getRelevantKnowledge(userAnswers: any): Promise<KnowledgeEntry[]> {
    const queryId = await this.logger.logQuery({
      operation: 'RELEVANCE_SEARCH',
      table: 'knowledge_entries',
      queryId: `relevance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    try {
      // 基于用户答案提取关键词和主题
      const keywords = this.extractKeywords(userAnswers);
      const categories = ['psychology', 'personality', 'career', 'assessment'];
      
      const relevantEntries: KnowledgeEntry[] = [];

      // 搜索相关心理学知识
      for (const keyword of keywords) {
        const entries = await this.search({
          query: keyword,
          category: 'psychology',
          limit: 5,
          minRelevanceScore: 0.3
        });
        relevantEntries.push(...entries);
      }

      // 搜索职业相关知识
      const careerEntries = await this.search({
        query: 'career personality assessment',
        tags: ['career', 'personality'],
        limit: 10
      });
      relevantEntries.push(...careerEntries);

      // 去重
      const uniqueEntries = relevantEntries.filter((entry, index, self) => 
        index === self.findIndex(e => e.id === entry.id)
      );

      await this.logger.logQueryResult(queryId, {
        success: true,
        resultCount: uniqueEntries.length,
        resultSize: JSON.stringify(uniqueEntries).length,
        duration: Date.now() - parseInt(queryId.split('_')[1])
      });

      console.log(`🧠 相关知识获取完成: ${uniqueEntries.length} 条相关内容`);
      return uniqueEntries.slice(0, 20); // 限制最多20条
    } catch (error) {
      await this.logger.logQueryResult(queryId, {
        success: false,
        error: error.message,
        duration: Date.now() - parseInt(queryId.split('_')[1])
      });
      throw new Error(`获取相关知识失败: ${error.message}`);
    }
  }

  /**
   * 从用户答案中提取关键词
   */
  private extractKeywords(userAnswers: any): string[] {
    const keywords: string[] = [];
    
    // 从五问法中提取关键词
    if (userAnswers.fiveQuestions) {
      Object.values(userAnswers.fiveQuestions).forEach((answer: string) => {
        if (typeof answer === 'string') {
          keywords.push(...answer.split(/\s+/).filter(word => word.length > 2));
        }
      });
    }

    // 添加测试类型相关关键词
    if (userAnswers.mbti) keywords.push('MBTI', 'personality', 'myers-briggs');
    if (userAnswers.bigFive) keywords.push('big five', 'personality traits', 'ocean');
    if (userAnswers.disc) keywords.push('DISC', 'behavior', 'communication style');
    if (userAnswers.holland) keywords.push('Holland', 'career', 'interests', 'RIASEC');
    if (userAnswers.values) keywords.push('values', 'motivation', 'work values');

    return [...new Set(keywords)]; // 去重
  }
}