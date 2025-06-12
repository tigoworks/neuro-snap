# 知识库系统

这是一个智能知识库系统，用于存储和管理心理测评相关的专业知识。

## 目录结构

- `files/` - 导入的原始文件
- `documents/` - 文档资料（Markdown、文本等）
- `analysis/` - 分析报告和研究资料
- `reports/` - 生成的分析报告
- `web-content/` - 从网站抓取的内容
- `databases/` - 数据库导出和备份

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

- `POST /api/analysis/knowledge/import/file` - 导入文件
- `POST /api/analysis/knowledge/import/url` - 导入网页
- `GET /api/analysis/knowledge/search` - 搜索知识库
- `GET /api/analysis/knowledge/stats` - 获取统计信息
