#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function initKnowledgeBase() {
  console.log('🚀 初始化知识库系统...\n');

  // 创建知识库目录结构
  const knowledgeBasePath = path.join(process.cwd(), 'knowledge-base');
  const subDirs = ['files', 'documents', 'analysis', 'reports', 'web-content', 'databases'];

  try {
    // 创建主目录
    if (!fs.existsSync(knowledgeBasePath)) {
      fs.mkdirSync(knowledgeBasePath, { recursive: true });
      console.log('✅ 创建知识库主目录:', knowledgeBasePath);
    }

    // 创建子目录
    for (const dir of subDirs) {
      const fullPath = path.join(knowledgeBasePath, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log('📁 创建子目录:', dir);
      }
    }

    // 创建示例知识库文件
    const exampleFiles = [
      {
        name: 'psychology-basics.md',
        content: `# 心理学基础知识

## MBTI人格类型理论

MBTI（Myers-Briggs Type Indicator）是一种人格分类理论，基于荣格的心理类型理论。

### 四个维度：
1. **外向(E) vs 内向(I)** - 能量来源
2. **感觉(S) vs 直觉(N)** - 信息收集方式  
3. **思考(T) vs 情感(F)** - 决策方式
4. **判断(J) vs 知觉(P)** - 生活方式

## 大五人格模型 (Big Five)

大五人格模型是现代心理学中最广泛接受的人格理论之一。

### 五个维度：
1. **开放性 (Openness)** - 对新体验的开放程度
2. **尽责性 (Conscientiousness)** - 自我控制和责任感
3. **外向性 (Extraversion)** - 社交活跃度
4. **宜人性 (Agreeableness)** - 合作和信任
5. **神经质 (Neuroticism)** - 情绪稳定性

## DISC行为风格理论

DISC是一种行为评估工具，用于描述人们的行为模式。

### 四种风格：
1. **支配型 (Dominance)** - 主导和控制
2. **影响型 (Influence)** - 影响和说服
3. **稳健型 (Steadiness)** - 稳定和支持
4. **谨慎型 (Conscientiousness)** - 准确和分析`
      },
      {
        name: 'career-guidance.md',
        content: `# 职业指导理论

## 霍兰德职业兴趣理论

霍兰德理论将职业兴趣分为六种基本类型（RIASEC）：

### 六种类型：
1. **现实型 (Realistic)** - 喜欢动手操作，偏爱具体任务
2. **研究型 (Investigative)** - 喜欢思考分析，解决抽象问题
3. **艺术型 (Artistic)** - 富有创造力，追求美感表达
4. **社会型 (Social)** - 热衷人际交往，助人为乐
5. **企业型 (Enterprising)** - 善于领导管理，追求成功
6. **常规型 (Conventional)** - 注重秩序规范，善于执行

## 职业价值观理论

职业价值观是指导职业选择和发展的内在动机系统。

### 主要价值观类型：
- **成就导向** - 追求成功和认可
- **安全导向** - 注重稳定和保障
- **关系导向** - 重视人际和团队
- **自主导向** - 追求独立和自由
- **服务导向** - 帮助他人和社会`
      }
    ];

    for (const file of exampleFiles) {
      const filePath = path.join(knowledgeBasePath, 'documents', file.name);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, file.content, 'utf8');
        console.log('📄 创建示例文档:', file.name);
      }
    }

    // 创建配置文件
    const configPath = path.join(knowledgeBasePath, 'config.json');
    const config = {
      version: '1.0.0',
      initialized: new Date().toISOString(),
      categories: ['psychology', 'career', 'personality', 'assessment', 'general'],
      maxEntries: 1000,
      allowedFileTypes: ['.md', '.txt', '.pdf', '.doc', '.docx', '.json'],
      webScrapingEnabled: true,
      autoTagging: true
    };

    if (!fs.existsSync(configPath)) {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
      console.log('⚙️  创建配置文件: config.json');
    }

    // 创建README
    const readmePath = path.join(knowledgeBasePath, 'README.md');
    const readmeContent = `# 知识库系统

这是一个智能知识库系统，用于存储和管理心理测评相关的专业知识。

## 目录结构

- \`files/\` - 导入的原始文件
- \`documents/\` - 文档资料（Markdown、文本等）
- \`analysis/\` - 分析报告和研究资料
- \`reports/\` - 生成的分析报告
- \`web-content/\` - 从网站抓取的内容
- \`databases/\` - 数据库导出和备份

## 使用说明

1. 使用API接口导入文件或网页内容
2. 系统会自动分类和标记内容
3. AI分析时会自动检索相关内容
4. 支持全文搜索和分类浏览

## 支持的文件类型

- Markdown (.md)
- 文本文件 (.txt)
- PDF文档 (.pdf)
- Word文档 (.doc, .docx)
- JSON数据 (.json)

## API接口

- \`POST /api/analysis/knowledge/import/file\` - 导入文件
- \`POST /api/analysis/knowledge/import/url\` - 导入网页
- \`GET /api/analysis/knowledge/search\` - 搜索知识库
- \`GET /api/analysis/knowledge/stats\` - 获取统计信息
`;

    if (!fs.existsSync(readmePath)) {
      fs.writeFileSync(readmePath, readmeContent, 'utf8');
      console.log('📚 创建README文档');
    }

    console.log('\n🎉 知识库初始化完成！');
    console.log('\n下一步：');
    console.log('1. 配置环境变量中的 OPENAI_API_KEY');
    console.log('2. 启动服务器：npm start');
    console.log('3. 使用API接口导入更多知识内容');
    console.log('4. 测试AI分析功能');

  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
    process.exit(1);
  }
}

// 运行初始化
if (require.main === module) {
  initKnowledgeBase();
}

module.exports = { initKnowledgeBase }; 