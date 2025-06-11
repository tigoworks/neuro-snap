# 🛡️ 前端应用API保护指南

## 问题背景

你的需求：
- ✅ 前端是开放性产品，不需要用户登录
- ✅ 防止恶意刷接口
- ✅ 只允许自己的前端应用调用API

## 🔧 保护方案

我为你实现了**多层次防护体系**，可以根据需要选择保护级别：

### 📊 保护级别对比

| 保护级别 | 防护措施 | 安全性 | 易用性 | 推荐场景 |
|---------|---------|--------|--------|----------|
| **Basic** | 速率限制 + UA检查 | ⭐⭐ | ⭐⭐⭐⭐⭐ | 开发测试 |
| **Standard** | Basic + Origin检查 + API Key | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | **推荐使用** |
| **Strict** | Origin检查 + 请求签名 + UA检查 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 高安全要求 |

## 🔐 环境配置

在你的 `.env.local` 文件中添加：

```bash
# 前端应用保护配置
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
FRONTEND_API_KEY=your-unique-frontend-app-key-2024
SIGNATURE_SECRET=your-super-secret-signature-key-for-strict-mode
SIGNATURE_WINDOW=300000
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=50
```

### 配置说明：

- `ALLOWED_ORIGINS`: 允许的前端域名（逗号分隔）
- `FRONTEND_API_KEY`: 前端应用专用的API密钥
- `SIGNATURE_SECRET`: 请求签名密钥（严格模式用）
- `SIGNATURE_WINDOW`: 签名有效期（毫秒，默认5分钟）
- `RATE_LIMIT_WINDOW`: 限流时间窗口（毫秒，默认15分钟）
- `RATE_LIMIT_MAX`: 每个时间窗口最大请求数（默认50次）

## 🚀 前端集成

### 方案一：使用提供的SDK（推荐）

1. **将 `frontend-sdk.js` 复制到你的前端项目**

2. **配置环境变量（Next.js项目）**：
```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_FRONTEND_API_KEY=your-unique-frontend-app-key-2024
# 如果使用严格模式，还需要：
NEXT_PUBLIC_SIGNATURE_SECRET=your-super-secret-signature-key-for-strict-mode
```

3. **在前端代码中使用**：
```javascript
import { neuroSnapAPI } from './frontend-sdk.js';

// 获取测试题目
try {
  const questions = await neuroSnapAPI.getSurveyQuestions('fiveq');
  console.log('题目加载成功:', questions);
} catch (error) {
  console.error('获取题目失败:', error.message);
}

// 提交测试结果
try {
  const result = await neuroSnapAPI.submitTest({
    userInfo: {
      name: "用户名",
      gender: "male",
      age: 25,
      // ... 其他信息
    },
    fiveQuestions: {
      "fiveq_q1": "我的答案",
      // ... 其他答案
    }
  });
  console.log('提交成功:', result);
} catch (error) {
  console.error('提交失败:', error.message);
}
```

### 方案二：手动配置请求头

```javascript
const API_BASE_URL = 'http://localhost:8080';
const FRONTEND_API_KEY = 'your-unique-frontend-app-key-2024';

// 安全的API调用函数
async function secureApiCall(url, options = {}) {
  return fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Frontend-Key': FRONTEND_API_KEY,
      ...options.headers,
    },
  });
}

// 使用示例
const response = await secureApiCall('/api/survey-questions?model=fiveq');
const data = await response.json();
```

## 🛡️ 保护机制详解

### 1. **Origin/Referer 检查**
- 验证请求来源域名
- 防止跨域恶意调用
- 开发环境自动放宽限制

### 2. **前端API Key验证**
- 每个前端应用有唯一标识
- 通过 `X-Frontend-Key` 头部传递
- 防止非授权应用调用

### 3. **增强速率限制**
- 基于IP+User Agent生成指纹
- 智能识别异常访问模式
- 可配置限流参数

### 4. **User Agent检查**
- 识别并阻止常见爬虫
- 防止脚本化攻击
- 生产环境自动启用

### 5. **请求签名（严格模式）**
- HMAC-SHA256签名验证
- 防重放攻击（时间戳验证）
- 最高安全级别

## 📈 使用建议

### 推荐配置（Standard级别）

1. **后端配置**：
```javascript
// 在 api.routes.ts 中
const frontendProtection = appProtection.createProtection('standard');
```

2. **环境变量**：
```bash
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
FRONTEND_API_KEY=neuro-snap-2024-secure-key
RATE_LIMIT_MAX=100  # 根据实际需求调整
```

3. **前端集成**：
- 使用提供的SDK
- 配置正确的API Key
- 确保请求来源正确

### 高安全场景（Strict级别）

如果你对安全要求特别高：

1. **后端配置**：
```javascript
const frontendProtection = appProtection.createProtection('strict');
```

2. **前端配置**：
```javascript
const api = new NeuroSnapAPI({
  baseURL: 'https://your-api-domain.com',
  apiKey: 'your-frontend-key',
  signatureSecret: 'your-signature-secret',
  useSignature: true  // 启用签名验证
});
```

## 🚨 安全注意事项

### ✅ 安全最佳实践：

1. **定期更换密钥**：
   - API Key每3-6个月更换一次
   - 签名密钥更频繁更换

2. **监控异常访问**：
   - 查看后端日志中的警告信息
   - 关注被阻止的请求来源

3. **域名白名单管理**：
   - 及时更新 `ALLOWED_ORIGINS`
   - 移除不再使用的域名

4. **生产环境配置**：
   - 使用HTTPS
   - 设置合适的CORS策略
   - 启用所有安全检查

### ⚠️ 注意事项：

1. **开发环境**：
   - Origin检查在开发环境会自动放宽
   - 确保生产环境配置正确

2. **CDN/代理**：
   - 如果使用CDN，注意Origin头的处理
   - 可能需要调整速率限制参数

3. **移动应用**：
   - 移动应用webview可能需要特殊处理
   - 可以为移动端创建专门的API Key

## 🧪 测试验证

### 测试保护是否生效：

```bash
# 1. 无API Key - 应该被拒绝
curl "http://localhost:8080/api/survey-questions?model=fiveq"

# 2. 错误的API Key - 应该被拒绝  
curl "http://localhost:8080/api/survey-questions?model=fiveq" \
  -H "X-Frontend-Key: wrong-key"

# 3. 正确的API Key - 应该成功
curl "http://localhost:8080/api/survey-questions?model=fiveq" \
  -H "X-Frontend-Key: your-unique-frontend-app-key-2024"

# 4. 测试速率限制 - 大量请求后应该被限制
for i in {1..60}; do
  curl "http://localhost:8080/api/survey-questions?model=fiveq" \
    -H "X-Frontend-Key: your-unique-frontend-app-key-2024"
done
```

## 🎯 总结

通过这套保护体系，你的API现在具备：

- ✅ **防刷接口**：多层限流机制
- ✅ **域名限制**：只有你的前端可以调用
- ✅ **开放使用**：用户无需登录
- ✅ **灵活配置**：可调整保护级别
- ✅ **监控告警**：详细的安全日志

**推荐使用Standard级别**，在安全性和易用性之间取得最佳平衡！🎉 