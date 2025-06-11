# API Migration Guide 🚀

## Overview
Your backend now provides two API endpoints that are fully compatible with your existing frontend:

1. `GET /api/survey-questions?model={type}` - Get survey questions
2. `POST /api/submit-test` - Submit test results

## Environment Setup

Create a `.env` file in your project root with the following variables:

```bash
# Server Configuration
NODE_ENV=development
PORT=8080
RATE_LIMIT=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_CONNECTION_STRING=your_connection_string
SUPABASE_DATABASE=your_database_name

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_ORGANIZATION_ID=your_organization_id
```

## API Endpoints

### 1. Get Survey Questions
```
GET /api/survey-questions?model={type}
```

**Supported model types:**
- `fiveq` - 五问法
- `mbti` - MBTI人格测试
- `big5` - 五大人格测试
- `disc` - DISC行为测试
- `holland` - 霍兰德职业兴趣测试
- `motivation` - 动机与价值观测试

**Response format:**
```json
{
  "model": {
    "id": "uuid",
    "name": "测试名称",
    "description": "测试描述"
  },
  "questions": [
    {
      "id": "uuid",
      "question_code": "fiveq_q1",
      "content": "题目内容",
      "options": [
        {"code": 1, "label": "选项A"},
        {"code": 2, "label": "选项B"}
      ],
      "type": "single",
      "sort_order": 1,
      "required": true
    }
  ]
}
```

### 2. Submit Test Results
```
POST /api/submit-test
```

**Request body format:**
```json
{
  "userInfo": {
    "name": "姓名",
    "gender": "male/female",
    "age": 25,
    "city": "城市",
    "occupation": "职业",
    "education": "学历",
    "phone": "手机号"
  },
  "fiveQuestions": {
    "fiveq_q1": "文本答案",
    "fiveq_q2": "文本答案"
  },
  "mbti": {
    "mbti_ei_q1": "1",
    "mbti_ei_q2": "2"
  },
  "bigFive": {
    "big5_o_q1": 4,
    "big5_o_q2": 3
  },
  "disc": {
    "disc_d_q1": "1",
    "disc_d_q2": "2"
  },
  "holland": {
    "holland_r_q1": 4,
    "holland_r_q2": 5
  },
  "values": {
    "motivation_q1": ["1", "3", "5"],
    "motivation_q2": ["2", "4"],
    "motivation_q3": {"order": [2, 1, 4, 3, 5]},
    "motivation_q4": "1",
    "motivation_q5": "文本答案",
    "motivation_q6": "3"
  }
}
```

**Success response:**
```json
{
  "message": "测试结果保存成功"
}
```

## Answer Format Types

Based on question type, answers should be formatted as:

- **single (单选)**: String - `"1"`
- **multiple (多选)**: String array - `["1", "3", "5"]`
- **scale (打分)**: Number - `4`
- **text (文本)**: String - `"我的答案"`
- **sorting (排序)**: Object - `{"order": [2, 1, 4, 3, 5]}`

## Database Schema Required

Your Supabase database should have these tables:

```sql
-- 测试模型表
CREATE TABLE survey_model (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  name TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 题目表
CREATE TABLE survey_question (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES survey_model(id),
  question_code TEXT,
  content TEXT,
  options JSONB,
  type TEXT CHECK (type IN ('single','multiple','scale','text','sorting')),
  sort_order INTEGER,
  required BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 用户信息表
CREATE TABLE user_survey (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  gender TEXT,
  age INTEGER,
  city TEXT,
  occupation TEXT,
  education TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 答案表
CREATE TABLE user_survey_answer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_survey_id UUID REFERENCES user_survey(id),
  question_id UUID REFERENCES survey_question(id),
  model_id UUID REFERENCES survey_model(id),
  answer JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Running the Backend

1. Install dependencies:
```bash
npm install
```

2. Set up your environment variables in `.env`

3. Run the database migrations (if you haven't already):
```bash
# Run the SQL scripts in database/migrations/ in your Supabase dashboard
```

4. Start the development server:
```bash
npm run dev
```

The backend will be available at `http://localhost:8080`

## Frontend Integration

Update your frontend's API base URL to point to the backend:

```typescript
// In your frontend project
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// Replace your existing API calls
const response = await fetch(`${API_BASE_URL}/api/survey-questions?model=fiveq`);
const response = await fetch(`${API_BASE_URL}/api/submit-test`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
});
```

## Error Handling

The API returns proper HTTP status codes:

- `200` - Success
- `400` - Bad Request (missing parameters)
- `404` - Not Found (model/questions not found)
- `500` - Internal Server Error

All error responses include an `error` field with a descriptive message.

## Rate Limiting

All endpoints are rate-limited to 100 requests per 15 minutes per IP address.

## CORS Configuration

The backend is configured to accept requests from your frontend origin. Update `CORS_ORIGIN` in your `.env` file as needed. 