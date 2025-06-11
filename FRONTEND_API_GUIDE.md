# 🌐 前端 API 调用指南

## 📋 概述

你的 Neuro-Snap 后端现在运行在 **端口 8080**，为前端提供了完整的个性测试API服务。

## 🔧 基础配置

### 服务器信息
- **开发环境**: `http://localhost:8080`
- **生产环境**: `https://your-domain.com:8080`
- **API 基础路径**: `/api`

### 前端环境变量配置

在你的前端项目中添加环境变量（例如 Next.js 的 `.env.local`）：

```bash
# API 服务器配置
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_FRONTEND_API_KEY=your-unique-frontend-app-key-2024

# 如果使用严格安全模式
NEXT_PUBLIC_SIGNATURE_SECRET=your-super-secret-signature-key
```

## 🛡️ 安全认证

### 必需的请求头

所有API请求都需要包含以下headers：

```javascript
const headers = {
  'Content-Type': 'application/json',
  'X-Frontend-Key': 'your-unique-frontend-app-key-2024',
  'Origin': 'http://localhost:3000', // 你的前端域名
  'User-Agent': 'YourApp/1.0.0'
}
```

## 📚 API 端点详解

### 1. 用户信息管理

#### 💾 保存用户信息
```javascript
POST /api/user/info

// 请求体
{
  "name": "张三",
  "gender": "male", // "male" | "female"
  "age": 25,
  "city": "北京",
  "occupation": "软件工程师",
  "education": "本科",
  "phone": "13812345678"
}

// 响应
{
  "message": "用户信息保存成功",
  "user_id": "uuid-string",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### 📖 获取用户信息
```javascript
GET /api/user/info?userId={user_id}

// 响应
{
  "user_id": "uuid-string",
  "name": "张三",
  "gender": "male",
  "age": 25,
  "city": "北京",
  "occupation": "软件工程师",
  "education": "本科",
  "phone": "13812345678",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 2. 问卷调查管理

#### 📝 获取测试题目
```javascript
GET /api/survey/model?code={model_code}

// 支持的测试类型：
// fiveq - 五问法
// mbti - MBTI人格测试
// big5 - 五大人格测试
// disc - DISC行为测试
// holland - 霍兰德职业兴趣测试
// motivation - 动机与价值观测试

// 响应
{
  "model": {
    "id": "uuid",
    "name": "MBTI人格测试",
    "description": "基于荣格理论的16型人格测试",
    "code": "mbti"
  },
  "questions": [
    {
      "id": "uuid",
      "question_code": "mbti_ei_q1",
      "content": "在社交聚会中，你更倾向于？",
      "options": [
        {"code": "1", "label": "主动与人交谈"},
        {"code": "2", "label": "等待别人主动交谈"}
      ],
      "type": "single", // single|multiple|scale|text|sorting
      "sort_order": 1,
      "required": true
    }
  ]
}
```

#### 📋 获取所有测试类型
```javascript
GET /api/survey/models

// 响应
{
  "models": [
    {
      "id": "uuid",
      "name": "五问法",
      "code": "fiveq",
      "description": "快速了解个人特质的五个核心问题"
    },
    {
      "id": "uuid", 
      "name": "MBTI人格测试",
      "code": "mbti",
      "description": "基于荣格理论的16型人格测试"
    }
    // ... 其他测试类型
  ]
}
```

### 3. 答案提交

#### ✅ 提交测试答案
```javascript
POST /api/answer/submit

// 请求体
{
  "userId": "uuid-string", // 必需
  "modelCode": "mbti", // 必需，测试类型
  "answers": {
    "mbti_ei_q1": "1",
    "mbti_ei_q2": "2",
    "mbti_sn_q1": "1",
    // ... 其他答案
  }
}

// 不同题目类型的答案格式：
// single (单选): "1"
// multiple (多选): ["1", "3", "5"]
// scale (打分): 4
// text (文本): "我的回答"
// sorting (排序): {"order": [2, 1, 4, 3, 5]}

// 响应
{
  "message": "答案提交成功",
  "survey_id": "uuid-string",
  "analysis_triggered": true // 是否触发了AI分析
}
```

### 4. AI 分析服务

#### 🧠 触发AI分析
```javascript
POST /api/analysis/analyze

// 请求体
{
  "modelType": "mbti",
  "answers": [
    {
      "question_code": "mbti_ei_q1",
      "answer": "1",
      "content": "在社交聚会中，你更倾向于？"
    }
  ],
  "knowledgeBase": [
    {
      "content": "MBTI相关的心理学知识",
      "metadata": {
        "source": "psychology_books",
        "type": "personality_theory"
      }
    }
  ],
  "options": {
    "temperature": 0.7,
    "max_tokens": 2000,
    "custom_prompt": "请详细分析用户的人格特征"
  }
}

// 响应
{
  "analysis": {
    "personality_type": "ENFP",
    "traits": {
      "extraversion": 0.8,
      "intuition": 0.7,
      "feeling": 0.6,
      "perceiving": 0.9
    },
    "strengths": ["创新思维", "善于沟通", "适应性强"],
    "weaknesses": ["注意力容易分散", "决策犹豫"]
  },
  "summary": "你是一个充满活力的创新者...",
  "confidence_score": 0.85,
  "knowledge_sources": ["psychology_theory", "mbti_research"],
  "processing_time": 2.5
}
```

#### 📊 查询分析状态
```javascript
GET /api/analysis/status/{surveyId}

// 响应
{
  "status": "completed", // "pending" | "processing" | "completed" | "error"
  "progress": 100,
  "result": {
    // 分析结果（如果已完成）
  },
  "error": null,
  "updated_at": "2024-01-15T10:35:00Z"
}
```

## 🔧 实用工具函数

### JavaScript/TypeScript SDK

```javascript
class NeuroSnapAPI {
  constructor(baseURL = 'http://localhost:8080', apiKey = '') {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Frontend-Key': this.apiKey,
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '请求失败');
      }

      return await response.json();
    } catch (error) {
      console.error('API请求错误:', error);
      throw error;
    }
  }

  // 保存用户信息
  async saveUserInfo(userInfo) {
    return this.request('/api/user/info', {
      method: 'POST',
      body: JSON.stringify(userInfo)
    });
  }

  // 获取测试题目
  async getSurveyQuestions(modelCode) {
    return this.request(`/api/survey/model?code=${modelCode}`);
  }

  // 获取所有测试类型
  async getAllModels() {
    return this.request('/api/survey/models');
  }

  // 提交答案
  async submitAnswers(userId, modelCode, answers) {
    return this.request('/api/answer/submit', {
      method: 'POST',
      body: JSON.stringify({ userId, modelCode, answers })
    });
  }

  // 获取分析结果
  async getAnalysisStatus(surveyId) {
    return this.request(`/api/analysis/status/${surveyId}`);
  }
}

// 使用示例
const api = new NeuroSnapAPI(
  process.env.NEXT_PUBLIC_API_BASE_URL,
  process.env.NEXT_PUBLIC_FRONTEND_API_KEY
);

export default api;
```

### React Hook 示例

```javascript
import { useState, useEffect } from 'react';
import api from './neuro-snap-api';

// 获取测试题目的Hook
export function useSurveyQuestions(modelCode) {
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!modelCode) return;

    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const data = await api.getSurveyQuestions(modelCode);
        setQuestions(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [modelCode]);

  return { questions, loading, error };
}

// 提交答案的Hook
export function useSubmitAnswers() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submitAnswers = async (userId, modelCode, answers) => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.submitAnswers(userId, modelCode, answers);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { submitAnswers, loading, error };
}
```

## ⚠️ 错误处理

### 常见HTTP状态码

- `200` - 成功
- `400` - 请求参数错误
- `401` - 认证失败（API Key无效）
- `403` - 访问被拒绝（域名不在白名单）
- `429` - 请求频率过高
- `500` - 服务器内部错误

### 错误响应格式

```javascript
{
  "error": true,
  "message": "错误描述",
  "code": "ERROR_CODE",
  "details": {
    // 详细错误信息
  }
}
```

### 前端错误处理示例

```javascript
async function handleAPICall() {
  try {
    const result = await api.getSurveyQuestions('mbti');
    return result;
  } catch (error) {
    switch (error.message) {
      case '请求频率过高':
        // 显示限流提示
        showToast('请求过于频繁，请稍后再试');
        break;
      case '认证失败':
        // 检查API Key配置
        console.error('API Key配置错误');
        break;
      case '域名不在白名单':
        // 检查域名配置
        console.error('域名配置错误');
        break;
      default:
        // 通用错误处理
        showToast('服务暂时不可用，请稍后重试');
    }
    throw error;
  }
}
```

## 🚀 部署注意事项

### 生产环境配置

1. **更新环境变量**：
```bash
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
NEXT_PUBLIC_FRONTEND_API_KEY=your-production-api-key
```

2. **CORS配置**：
确保后端 `ALLOWED_ORIGINS` 包含你的生产域名

3. **HTTPS**：
生产环境强烈建议使用HTTPS

### 性能优化建议

1. **请求缓存**：对不经常变化的数据（如测试题目）进行客户端缓存
2. **错误重试**：实现指数退避的重试机制
3. **请求去重**：避免重复请求相同的API
4. **分页加载**：对大量数据进行分页处理

## 📞 技术支持

如果在集成过程中遇到问题：

1. 检查浏览器控制台的网络请求
2. 确认API Key和域名配置正确
3. 查看后端日志了解详细错误信息
4. 参考 `FRONTEND_PROTECTION_GUIDE.md` 了解安全配置

---

🎯 **快速开始**：复制上面的 `NeuroSnapAPI` 类到你的项目中，配置好环境变量，就可以开始调用API了！ 