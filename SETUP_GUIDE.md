# 🚀 Backend Setup Guide

## 环境配置

创建 `.env.local` 文件（或 `.env` 文件），内容如下：

```bash
# 服务器配置
NODE_ENV=development
PORT=8080
RATE_LIMIT=100

# CORS配置 - 允许前端访问
CORS_ORIGIN=http://localhost:3000

# 认证配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production-256-bit
API_KEY=your-api-key-for-service-calls
TOKEN_EXPIRY=86400

# Supabase数据库配置
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_CONNECTION_STRING=your_connection_string
SUPABASE_DATABASE=your_database_name

# OpenAI配置（用于AI分析功能）
OPENAI_API_KEY=your_openai_api_key
OPENAI_ORGANIZATION_ID=your_organization_id

# AI服务配置
AI_MODEL=gpt-3.5-turbo
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=1000
AI_RETRY_COUNT=3
AI_RETRY_DELAY=1000
```

> 💡 **注意**：应用会优先读取 `.env.local` 文件，如果不存在则读取 `.env` 文件。

> 🔐 **安全提醒**：生产环境请务必更换 `JWT_SECRET` 和 `API_KEY` 为强密码！

## 📊 数据库结构

确保你的Supabase数据库有以下表结构：

```sql
-- 测试模型表
CREATE TABLE survey_model (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 'fiveq', 'mbti', 'big5', 'disc', 'holland', 'motivation'
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 题目表  
CREATE TABLE survey_question (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES survey_model(id) NOT NULL,
  question_code TEXT NOT NULL, -- 'fiveq_q1', 'mbti_ei_q1' 等
  content TEXT NOT NULL,
  options JSONB, -- [{"code":1,"label":"选项A"}] 或 null
  type TEXT CHECK (type IN ('single','multiple','scale','text','sorting')) NOT NULL,
  sort_order INTEGER NOT NULL,
  required BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 用户信息表
CREATE TABLE user_survey (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female')),
  age INTEGER,
  city TEXT,
  occupation TEXT,
  education TEXT,
  phone TEXT,
  user_id UUID, -- 关联到认证用户（可选）
  created_at TIMESTAMP DEFAULT NOW()
);

-- 答案表
CREATE TABLE user_survey_answer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_survey_id UUID REFERENCES user_survey(id) NOT NULL,
  question_id UUID REFERENCES survey_question(id) NOT NULL,
  model_id UUID REFERENCES survey_model(id) NOT NULL,
  answer JSONB NOT NULL, -- 存储各种格式的答案
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引提高查询性能
CREATE INDEX idx_survey_question_model_id ON survey_question(model_id);
CREATE INDEX idx_survey_question_sort_order ON survey_question(sort_order);
CREATE INDEX idx_user_survey_answer_user_id ON user_survey_answer(user_survey_id);
CREATE INDEX idx_user_survey_answer_question_id ON user_survey_answer(question_id);
CREATE INDEX idx_user_survey_user_id ON user_survey(user_id);
```

## 🛠️ 启动步骤

1. **安装依赖**
```bash
npm install
```

2. **配置环境变量**
```bash
# 如果你已经有 .env.local 文件，直接编辑即可
# 或者创建新的环境变量文件
cp .env.example .env.local
# 然后编辑 .env.local 文件填入你的配置
```

3. **启动开发服务器**
```bash
npm run dev
```

服务器将在 `http://localhost:8080` 启动

## 🔐 认证接口

### 用户注册
```bash
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "用户名"
}
```

### 用户登录
```bash
POST /api/auth/login
{
  "email": "user@example.com", 
  "password": "password123"
}
```

### 验证Token
```bash
GET /api/auth/validate
Authorization: Bearer <your_token>
```

### 获取当前用户
```bash
GET /api/auth/me
Authorization: Bearer <your_token>
```

### 登出
```bash
POST /api/auth/logout
Authorization: Bearer <your_token>
```

## 🛡️ 鉴权方案

提供了多种鉴权方式：

### 1. 无鉴权（公开接口）
```typescript
// 直接访问，无需任何token
fetch('/api/survey-questions?model=fiveq')
```

### 2. API Key 鉴权（服务间调用）
```typescript
fetch('/api/some-endpoint', {
  headers: {
    'X-API-Key': 'your-api-key'
  }
})
```

### 3. JWT Token 鉴权（用户会话）
```typescript
fetch('/api/some-endpoint', {
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  }
})
```

### 4. Supabase Auth 鉴权（推荐）
```typescript
fetch('/api/some-endpoint', {
  headers: {
    'Authorization': 'Bearer supabase-session-token'
  }
})
```

### 5. 可选鉴权
- 有token则验证用户身份
- 无token则作为匿名用户处理
- 适用于测试提交等场景

## 🧪 测试API

手动测试：

### 测试用户注册
```bash
curl -X POST "http://localhost:8080/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "测试用户"
  }'
```

### 测试用户登录
```bash
curl -X POST "http://localhost:8080/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 测试获取题目（匿名）
```bash
curl "http://localhost:8080/api/survey-questions?model=fiveq"
```

### 测试获取题目（已认证）
```bash
curl "http://localhost:8080/api/survey-questions?model=fiveq" \
  -H "Authorization: Bearer <your_token>"
```

### 测试提交结果
```bash
curl -X POST "http://localhost:8080/api/submit-test" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "userInfo": {
      "name": "测试用户",
      "gender": "male",
      "age": 25,
      "city": "北京",
      "occupation": "软件工程师",
      "education": "本科",
      "phone": "13800138000"
    },
    "fiveQuestions": {
      "fiveq_q1": "我是一个积极向上的人"
    }
  }'
```

## 🔗 前端集成

在你的前端项目中集成认证：

```typescript
// API配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// 用户登录
const login = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  // 保存token到localStorage或context
  localStorage.setItem('token', data.session.access_token);
  
  return data;
};

// 带认证的API调用
const authenticatedRequest = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  return fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  });
};

// 获取题目（支持匿名和认证用户）
const response = await authenticatedRequest('/api/survey-questions?model=fiveq');

// 提交测试（支持匿名和认证用户）
const response = await authenticatedRequest('/api/submit-test', {
  method: 'POST',
  body: JSON.stringify(testData)
});
```

## ✅ 兼容性确认

你的后端现在完全兼容前端期望的接口，并增加了完整的认证体系：

- ✅ **完全向后兼容**：所有原有接口保持不变
- ✅ **可选认证**：匿名用户可以正常使用，登录用户有额外功能
- ✅ **多种鉴权方式**：支持API Key、JWT、Supabase Auth
- ✅ **安全防护**：速率限制、token验证、CORS配置
- ✅ **用户管理**：注册、登录、登出、用户信息管理
- ✅ **会话管理**：token刷新、验证、过期处理

现在你的API既支持匿名用户使用，也支持完整的用户认证体系！🔐 