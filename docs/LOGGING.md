# 📋 Neuro-Snap API 日志系统文档

## 🎯 概述

Neuro-Snap API 配备了完整的日志系统，可以详细记录API请求、数据库查询、错误信息等，方便开发调试和生产监控。

## 📁 日志文件结构

```
logs/
├── combined.log    # 所有日志（包括info、warn、error）
└── error.log       # 仅错误日志
```

## 🚀 日志类型

### 1. API请求日志
- **🚀 请求开始**：记录请求ID、方法、路径、查询参数、请求头、客户端信息
- **✅ 请求完成**：记录响应时间、状态码、响应大小
- **❌ 请求错误**：记录错误信息和堆栈

### 2. 数据库查询日志
- **🗄️ 查询开始**：记录查询ID、表名、操作类型、查询条件
- **✅ 查询成功**：记录查询时间、结果数量、结果大小
- **❌ 查询失败**：记录错误信息和查询详情

### 3. 安全日志
- API Key验证
- 跨域请求检查
- 速率限制

## 🛠️ 使用方法

### npm 脚本命令

```bash
# 查看最近50条日志
npm run logs

# 查看API请求日志（带详细信息）
npm run logs:api

# 查看数据库查询日志（带详细信息）
npm run logs:db

# 查看错误日志
npm run logs:errors

# 查看日志统计报告
npm run logs:stats

# 清空日志文件
npm run logs:clear
```

### 直接使用脚本

```bash
# 基本用法
node scripts/view-logs.js --tail 20

# 按类型过滤
node scripts/view-logs.js --type error
node scripts/view-logs.js --type info

# 按关键词搜索
node scripts/view-logs.js --grep "Database Query"
node scripts/view-logs.js --grep "API Request"

# 显示详细信息
node scripts/view-logs.js --api --details
node scripts/view-logs.js --db --details

# 统计分析
node scripts/log-stats.js
```

## 📊 日志格式

### API请求日志示例

```json
{
  "level": "info",
  "message": "🚀 API Request Started",
  "requestId": "cf12314e4170538b",
  "timestamp": "2025-06-11T13:49:28.097Z",
  "method": "GET",
  "url": "/health",
  "path": "/health",
  "query": {},
  "headers": {
    "content-type": "application/json",
    "user-agent": "curl/8.7.1",
    "x-frontend-key": "[PRESENT]"
  },
  "clientInfo": {
    "ip": "::1",
    "userAgent": "curl/8.7.1"
  },
  "body": {}
}
```

### 数据库查询日志示例

```json
{
  "level": "info",
  "message": "🗄️ Database Query Started",
  "queryId": "de7bd0729246",
  "timestamp": "2025-06-11T13:50:31.069Z",
  "table": "survey_model",
  "operation": "SELECT",
  "filters": {
    "code": "mbti"
  }
}
```

## 📈 统计报告功能

日志统计工具提供以下分析：

### API性能分析
- 总请求数量
- 成功率和错误率
- 平均响应时间
- 按HTTP方法统计
- 热门API端点

### 数据库性能分析
- 总查询数量
- 查询成功率
- 平均查询时间
- 按数据表统计
- 按操作类型统计

### 错误分析
- 错误总数
- 最近错误详情
- 错误类型分布

### 性能建议
- 响应时间优化建议
- 数据库查询优化建议
- 错误率改善建议

## 🔧 配置选项

### Winston 日志配置

```typescript
// src/utils/logger.ts
const logger = winston.createLogger({
  level: config.env === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});
```

### 日志级别

- **error**: 错误信息
- **warn**: 警告信息
- **info**: 一般信息（API请求、数据库查询）
- **debug**: 调试信息（仅开发环境）

## 🔍 故障排查

### 常见问题

1. **日志文件不存在**
   ```bash
   mkdir -p logs
   ```

2. **权限问题**
   ```bash
   chmod +x scripts/*.js
   ```

3. **查看实时日志**
   ```bash
   tail -f logs/combined.log
   ```

4. **按时间过滤日志**
   ```bash
   grep "2025-06-11T13:" logs/combined.log
   ```

## 🎨 日志颜色说明

- 🚀 **绿色**: API请求开始、成功
- ✅ **绿色**: 操作成功
- ❌ **红色**: 错误和失败
- 🗄️ **青色**: 数据库查询
- ⚠️ **黄色**: 警告信息
- 📊 **紫色**: 统计数据

## 📝 最佳实践

1. **定期查看日志统计**
   ```bash
   npm run logs:stats
   ```

2. **监控错误日志**
   ```bash
   npm run logs:errors
   ```

3. **性能优化**
   - 关注响应时间超过500ms的请求
   - 关注数据库查询时间超过100ms的操作

4. **日志清理**
   ```bash
   # 保留最近7天的日志
   find logs/ -name "*.log" -mtime +7 -delete
   ```

5. **生产环境建议**
   - 使用日志轮转工具（如logrotate）
   - 集成外部日志服务（如ELK Stack）
   - 设置日志告警

## 🔗 相关文件

- `src/middleware/request-logger.middleware.ts` - 请求日志中间件
- `src/services/database-logger.service.ts` - 数据库日志服务
- `src/utils/logger.ts` - Winston 日志配置
- `scripts/view-logs.js` - 日志查看工具
- `scripts/log-stats.js` - 日志统计工具 