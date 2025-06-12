# 心理测评系统 API 接口文档

## 概述

心理测评系统提供用户信息管理和测评答案提交功能。所有接口都需要通过前端密钥进行身份验证。

## 基础信息

- **基础URL**: `http://localhost:8080`
- **内容类型**: `application/json`
- **认证方式**: 请求头中包含 `X-Frontend-Key`

## 认证

所有API请求都必须在请求头中包含以下认证信息：

```http
X-Frontend-Key: your-unique-frontend-app-key-2024
```

---

## 1. 用户信息管理

### 1.1 保存用户信息

**接口地址**: `POST /api/user/info`

**功能描述**: 保存用户的基本信息

#### 请求头
```http
Content-Type: application/json
X-Frontend-Key: your-unique-frontend-app-key-2024
```

#### 请求体
```json
{
  "name": "string",        // 必填，用户姓名
  "gender": "string",      // 必填，性别，值为 "男" 或 "女"
  "age": "string",         // 必填，年龄，字符串格式，会自动转换为数字
  "city": "string",        // 必填，所在城市
  "occupation": "string",  // 必填，职业
  "education": "string",   // 必填，学历
  "phone": "string"        // 可选，手机号（会自动脱敏处理）
}
```

#### 字段说明

| 字段 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| name | string | 是 | 用户姓名 | "张三" |
| gender | string | 是 | 性别，"男"或"女" | "男" |
| age | string | 是 | 年龄（字符串格式） | "25" |
| city | string | 是 | 所在城市 | "北京" |
| occupation | string | 是 | 职业 | "程序员" |
| education | string | 是 | 学历 | "本科" |
| phone | string | 否 | 手机号 | "13800138000" |

#### 请求示例
```bash
curl -X POST "http://localhost:8080/api/user/info" \
  -H "Content-Type: application/json" \
  -H "X-Frontend-Key: your-unique-frontend-app-key-2024" \
  -d '{
    "name": "张三",
    "gender": "男",
    "age": "25",
    "city": "北京",
    "occupation": "程序员",
    "education": "本科",
    "phone": "13800138000"
  }'
```

#### 成功响应
```json
{
  "message": "用户信息保存成功",
  "userId": "uuid-string",
  "user": {
    "id": "uuid-string",
    "name": "张三",
    "gender": "male",
    "age": 25,
    "city": "北京",
    "occupation": "程序员",
    "education": "本科",
    "submit_time": "2023-12-01T08:00:00Z"
  }
}
```

#### 错误响应
```json
{
  "error": "保存用户信息失败",
  "details": "具体错误信息"
}
```

---

### 1.2 获取用户信息

**接口地址**: `GET /api/user/info/:userId`

**功能描述**: 根据用户ID获取用户信息

#### 请求头
```http
X-Frontend-Key: your-unique-frontend-app-key-2024
```

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 是 | 用户UUID |

#### 请求示例
```bash
curl -X GET "http://localhost:8080/api/user/info/uuid-string" \
  -H "X-Frontend-Key: your-unique-frontend-app-key-2024"
```

#### 成功响应
```json
{
  "id": "uuid-string",
  "name": "张三",
  "gender": "male",
  "age": 25,
  "city": "北京",
  "occupation": "程序员",
  "education": "本科",
  "submit_time": "2023-12-01T08:00:00Z"
}
```

---

## 2. 测评答案提交

### 2.1 提交测评答案

**接口地址**: `POST /api/answer/submit`

**功能描述**: 提交完整的测评答案，包含所有7种测试类型

#### 请求头
```http
Content-Type: application/json
X-Frontend-Key: your-unique-frontend-app-key-2024
```

#### 请求体结构

请求体必须包含以下**7个必填字段**：

```json
{
  "userInfo": {
    // 用户基本信息
  },
  "fiveQuestions": {
    // 五问法测试答案
  },
  "mbti": {
    // MBTI人格测试答案
  },
  "bigFive": {
    // 五大人格测试答案
  },
  "disc": {
    // DISC行为测试答案
  },
  "holland": {
    // 霍兰德职业兴趣测试答案
  },
  "values": {
    // 职业价值观测试答案
  }
}
```

#### 详细字段说明

##### 2.1.1 userInfo (用户信息)
```json
{
  "userInfo": {
    "name": "string",        // 必填，用户姓名
    "gender": "string",      // 必填，性别，"male" 或 "female"
    "age": 25,              // 必填，年龄，数字类型
    "city": "string",        // 必填，所在城市
    "occupation": "string",  // 必填，职业
    "education": "string",   // 必填，学历
    "phone": "string"        // 可选，手机号
  }
}
```

##### 2.1.2 fiveQuestions (五问法测试)
```json
{
  "fiveQuestions": {
    "fiveq_q1": "string",    // 第一个问题的答案
    "fiveq_q2": "string"     // 第二个问题的答案
  }
}
```

##### 2.1.3 mbti (MBTI人格测试)
```json
{
  "mbti": {
    "mbti_ei_q1": "string",  // 内外向题目1
    "mbti_ei_q2": "string",  // 内外向题目2
    "mbti_sn_q1": "string",  // 感觉直觉题目1
    "mbti_sn_q2": "string",  // 感觉直觉题目2
    "mbti_tf_q1": "string",  // 思考情感题目1
    "mbti_tf_q2": "string",  // 思考情感题目2
    "mbti_jp_q1": "string",  // 判断感知题目1
    "mbti_jp_q2": "string"   // 判断感知题目2
  }
}
```

##### 2.1.4 bigFive (五大人格测试)
```json
{
  "bigFive": {
    "big5_o_q1": 4,          // 开放性题目1 (1-5分)
    "big5_o_q2": 3,          // 开放性题目2 (1-5分)
    "big5_c_q1": 5,          // 尽责性题目1 (1-5分)
    "big5_c_q2": 4,          // 尽责性题目2 (1-5分)
    "big5_e_q1": 3,          // 外向性题目1 (1-5分)
    "big5_e_q2": 2,          // 外向性题目2 (1-5分)
    "big5_a_q1": 4,          // 宜人性题目1 (1-5分)
    "big5_a_q2": 5,          // 宜人性题目2 (1-5分)
    "big5_n_q1": 2,          // 神经质题目1 (1-5分)
    "big5_n_q2": 1           // 神经质题目2 (1-5分)
  }
}
```

##### 2.1.5 disc (DISC行为测试)
```json
{
  "disc": {
    "disc_d_q1": "string",   // 支配性题目1
    "disc_d_q2": "string",   // 支配性题目2
    "disc_i_q1": "string",   // 影响性题目1
    "disc_i_q2": "string",   // 影响性题目2
    "disc_s_q1": "string",   // 稳定性题目1
    "disc_s_q2": "string",   // 稳定性题目2
    "disc_c_q1": "string",   // 谨慎性题目1
    "disc_c_q2": "string"    // 谨慎性题目2
  }
}
```

##### 2.1.6 holland (霍兰德职业兴趣测试)
```json
{
  "holland": {
    "holland_r_q1": 2,       // 现实型题目1 (1-5分)
    "holland_r_q2": 3,       // 现实型题目2 (1-5分)
    "holland_i_q1": 4,       // 研究型题目1 (1-5分)
    "holland_i_q2": 5,       // 研究型题目2 (1-5分)
    "holland_a_q1": 3,       // 艺术型题目1 (1-5分)
    "holland_a_q2": 2,       // 艺术型题目2 (1-5分)
    "holland_s_q1": 4,       // 社会型题目1 (1-5分)
    "holland_s_q2": 3,       // 社会型题目2 (1-5分)
    "holland_e_q1": 5,       // 企业型题目1 (1-5分)
    "holland_e_q2": 4,       // 企业型题目2 (1-5分)
    "holland_c_q1": 2,       // 常规型题目1 (1-5分)
    "holland_c_q2": 1,       // 常规型题目2 (1-5分)
    // ... 可能包含更多题目到holland_*_q18
  }
}
```

##### 2.1.7 values (职业价值观测试)
```json
{
  "values": {
    "motivation_q1": ["1", "3", "5"],  // 动机题目1 (多选)
    "motivation_q2": ["2", "4"],       // 动机题目2 (多选)
    "motivation_q3": ["1", "2", "3"],  // 动机题目3 (多选)
    "motivation_q4": "string",         // 动机题目4 (单选/文本)
    "motivation_q5": "string",         // 动机题目5 (单选/文本)
    "motivation_q6": "string"          // 动机题目6 (单选/文本)
  }
}
```

#### 完整请求示例

```bash
curl -X POST "http://localhost:8080/api/answer/submit" \
  -H "Content-Type: application/json" \
  -H "X-Frontend-Key: your-unique-frontend-app-key-2024" \
  -d '{
    "userInfo": {
      "name": "张三",
      "gender": "male",
      "age": 25,
      "city": "北京",
      "occupation": "程序员",
      "education": "本科"
    },
    "fiveQuestions": {
      "fiveq_q1": "职业发展是我最关注的问题",
      "fiveq_q2": "最近学习了用户体验设计"
    },
    "mbti": {
      "mbti_ei_q1": "1",
      "mbti_ei_q2": "2",
      "mbti_sn_q1": "1",
      "mbti_sn_q2": "2",
      "mbti_tf_q1": "1",
      "mbti_tf_q2": "2",
      "mbti_jp_q1": "1",
      "mbti_jp_q2": "2"
    },
    "bigFive": {
      "big5_o_q1": 4,
      "big5_o_q2": 3,
      "big5_c_q1": 5,
      "big5_c_q2": 4,
      "big5_e_q1": 3,
      "big5_e_q2": 2,
      "big5_a_q1": 4,
      "big5_a_q2": 5,
      "big5_n_q1": 2,
      "big5_n_q2": 1
    },
    "disc": {
      "disc_d_q1": "1",
      "disc_d_q2": "2",
      "disc_i_q1": "1",
      "disc_i_q2": "2",
      "disc_s_q1": "1",
      "disc_s_q2": "2",
      "disc_c_q1": "1",
      "disc_c_q2": "2"
    },
    "holland": {
      "holland_r_q1": 2,
      "holland_r_q2": 3,
      "holland_i_q1": 4,
      "holland_i_q2": 5,
      "holland_a_q1": 3,
      "holland_a_q2": 2,
      "holland_s_q1": 4,
      "holland_s_q2": 3,
      "holland_e_q1": 5,
      "holland_e_q2": 4,
      "holland_c_q1": 2,
      "holland_c_q2": 1
    },
    "values": {
      "motivation_q1": ["1", "3", "5"],
      "motivation_q2": ["2", "4"],
      "motivation_q3": ["1", "2", "3"],
      "motivation_q4": "视为学习机会",
      "motivation_q5": "追求卓越",
      "motivation_q6": "执行者"
    }
  }'
```

#### 成功响应
```json
{
  "message": "测试结果保存成功",
  "surveyId": "uuid-string",
  "stats": {
    "totalAnswers": 12,
    "answersByType": {
      "fiveq": 2,
      "mbti": 8,
      "big5": 10,
      "disc": 8,
      "holland": 12,
      "motivation": 6
    },
    "duration": "2404ms"
  }
}
```

#### 错误响应

##### 数据不完整错误
```json
{
  "error": "数据不完整，请确保所有测试都已完成",
  "code": "INCOMPLETE_DATA",
  "details": {
    "message": "请完成剩余 3 个测试",
    "missingTests": [
      {
        "name": "MBTI十六型人格测试",
        "page": "MBTI人格测试页面",
        "field": "mbti"
      },
      {
        "name": "DISC行为风格测试",
        "page": "DISC行为测试页面",
        "field": "disc"
      },
      {
        "name": "职业价值观评估测试",
        "page": "价值观测试页面",
        "field": "values"
      }
    ],
    "completedCount": 4,
    "totalRequired": 7,
    "nextStep": "请返回MBTI人格测试页面完成测试"
  }
}
```

##### 其他错误
```json
{
  "error": "错误信息",
  "details": "具体错误详情"
}
```

---

## 3. 数据验证规则

### 3.1 必填字段验证

答案提交接口必须包含以下7个顶级字段，缺少任何一个都会返回验证错误：

1. `userInfo` - 用户基本信息
2. `fiveQuestions` - 五问法测试答案  
3. `mbti` - MBTI人格测试答案
4. `bigFive` - 五大人格测试答案
5. `disc` - DISC行为测试答案
6. `holland` - 霍兰德职业兴趣测试答案
7. `values` - 职业价值观测试答案

### 3.2 数据类型验证

- 字符串字段不能为空
- 数字字段必须是有效数字
- 数组字段必须是有效数组
- 年龄会自动从字符串转换为数字
- 性别会自动映射（"男" → "male", "女" → "female"）

---

## 4. 错误码说明

| 错误码 | 说明 | 处理建议 |
|--------|------|----------|
| `INCOMPLETE_DATA` | 数据不完整 | 根据返回的缺失字段信息，跳转到对应页面完成测试 |
| `VALIDATION_ERROR` | 数据验证失败 | 检查数据格式和必填字段 |
| `AUTH_ERROR` | 认证失败 | 检查X-Frontend-Key是否正确 |
| `SERVER_ERROR` | 服务器错误 | 联系技术支持 |

---

## 5. 调试信息

系统提供详细的日志记录，包括：

- 请求和响应的完整内容
- 数据验证的详细结果  
- 数据库操作的执行情况
- 事务处理的完整流程
- 错误发生时的上下文信息

开发过程中可以通过日志快速定位问题。

---

## 6. 注意事项

1. **认证必须**: 所有请求都必须包含正确的`X-Frontend-Key`
2. **数据完整性**: 答案提交必须包含所有7种测试的数据
3. **数据格式**: 严格按照文档格式提交数据，注意数据类型
4. **错误处理**: 根据返回的错误信息进行相应的用户提示和页面跳转
5. **性能考虑**: 答案提交是事务性操作，可能需要几秒钟时间
6. **数据安全**: 手机号等敏感信息会自动脱敏处理

---

## 7. 前端集成示例

### JavaScript/TypeScript 示例

```typescript
// 用户信息提交
async function submitUserInfo(userInfo: UserInfo) {
  const response = await fetch('/api/user/info', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Frontend-Key': 'your-unique-frontend-app-key-2024'
    },
    body: JSON.stringify(userInfo)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  return await response.json();
}

// 答案提交
async function submitAnswers(answers: CompleteAnswers) {
  const response = await fetch('/api/answer/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Frontend-Key': 'your-unique-frontend-app-key-2024'
    },
    body: JSON.stringify(answers)
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    if (result.code === 'INCOMPLETE_DATA') {
      // 处理数据不完整错误
      const missingTests = result.details.missingTests;
      alert(`请完成以下测试：${missingTests.map(t => t.name).join('、')}`);
      // 跳转到第一个缺失的测试页面
      window.location.href = `/${missingTests[0].field}`;
    } else {
      throw new Error(result.error);
    }
  }
  
  return result;
}

// 数据完整性检查
function validateCompleteData(data: any): boolean {
  const requiredFields = [
    'userInfo', 'fiveQuestions', 'mbti', 
    'bigFive', 'disc', 'holland', 'values'
  ];
  
  return requiredFields.every(field => data[field] && 
    typeof data[field] === 'object' && 
    Object.keys(data[field]).length > 0
  );
}
```

---

## 8. AI分析与知识库系统 🤖

### 8.1 生成AI分析报告

**接口地址**: `POST /api/analysis/generate`

**功能描述**: 基于用户测评数据和知识库内容，使用OpenAI生成详细的心理测评分析报告

#### 请求体
```json
{
  "userId": "string",              // 必填，用户ID
  "userAnswers": {                 // 必填，完整的测评答案
    "userInfo": { /* 用户信息 */ },
    "fiveQuestions": { /* 五问法答案 */ },
    "mbti": { /* MBTI答案 */ },
    "bigFive": { /* 大五人格答案 */ },
    "disc": { /* DISC答案 */ },
    "holland": { /* 霍兰德答案 */ },
    "values": { /* 价值观答案 */ }
  },
  "analysisType": "comprehensive", // 可选，分析类型
  "language": "zh"                 // 可选，语言
}
```

#### 成功响应
```json
{
  "success": true,
  "data": {
    "analysisId": "analysis_1701234567890_abc123",
    "report": {
      "summary": {
        "title": "个人特质深度分析报告",
        "overview": "基于您的测评结果，您展现出...",
        "keyInsights": ["洞察1", "洞察2", "洞察3"],
        "strengthsAndWeaknesses": {
          "strengths": ["优势1", "优势2"],
          "weaknesses": ["待改进1", "待改进2"],
          "improvementAreas": ["发展方向1", "发展方向2"]
        }
      },
      "personalityProfile": {
        "mbtiType": "INFP",
        "mbtiDescription": "理想主义者，富有创造力...",
        "bigFiveScores": {
          "openness": 85,
          "conscientiousness": 70,
          "extraversion": 30,
          "agreeableness": 80,
          "neuroticism": 45
        },
        "discProfile": {
          "dominance": 20,
          "influence": 40,
          "steadiness": 75,
          "conscientiousness": 65,
          "primaryStyle": "Steady"
        },
        "hollandCode": {
          "realistic": 25,
          "investigative": 85,
          "artistic": 75,
          "social": 70,
          "enterprising": 35,
          "conventional": 40,
          "topThree": ["Investigative", "Artistic", "Social"]
        }
      },
      "careerGuidance": {
        "idealCareers": [
          {
            "title": "数据科学家",
            "match": 92,
            "description": "运用统计学和机器学习分析大数据",
            "requirements": ["Python", "统计学", "机器学习"],
            "growthPotential": "数据驱动决策需求持续增长"
          }
        ],
        "careerDevelopmentPlan": {
          "shortTerm": ["学习Python编程", "掌握SQL数据库"],
          "mediumTerm": ["获得数据分析认证", "参与实际项目"],
          "longTerm": ["成为高级数据科学家", "建立专业影响力"]
        },
        "skillsToImprove": ["数据可视化", "商业理解", "沟通表达"],
        "industryRecommendations": ["科技", "金融", "医疗", "电商"]
      },
      "workStyle": {
        "preferredEnvironment": "安静、独立的工作环境",
        "workingStyle": "深度思考型，注重质量胜过速度",
        "communicationStyle": "倾听型，善于一对一深度交流",
        "leadershipStyle": "教练型领导，激发他人潜能",
        "teamRole": "专家顾问，提供深度见解",
        "motivationFactors": ["专业成长", "创新挑战", "团队认可"]
      },
      "recommendations": {
        "personalDevelopment": [
          "培养公众演讲能力",
          "学习项目管理技能",
          "建立个人品牌"
        ],
        "learningResources": [
          "《深度工作》- Cal Newport",
          "Coursera机器学习课程",
          "TED演讲技巧视频"
        ],
        "actionItems": [
          "制定3个月学习计划",
          "寻找导师或教练",
          "加入专业社群"
        ],
        "nextSteps": [
          "完善技能评估",
          "制定职业发展路线图",
          "开始实施学习计划"
        ]
      },
      "visualizationData": {
        "personalityChart": {
          "type": "radar",
          "data": { /* Chart.js格式数据 */ }
        },
        "careerFitChart": {
          "type": "bar",
          "data": { /* 职业匹配度图表 */ }
        },
        "hollandChart": {
          "type": "polarArea",
          "data": { /* 霍兰德兴趣图表 */ }
        }
      }
    },
    "metadata": {
      "confidence": 0.87,
      "processingTime": 12500,
      "knowledgeSourcesUsed": 15,
      "analysisType": "comprehensive",
      "createdAt": "2024-06-11T14:30:00Z"
    }
  }
}
```

### 8.2 预览分析（不保存）

**接口地址**: `POST /api/analysis/preview`

**功能描述**: 快速预览分析结果，不保存到数据库

```json
{
  "userAnswers": { /* 测评数据 */ },
  "analysisType": "personality",
  "language": "zh"
}
```

### 8.3 知识库管理

#### 搜索知识库
**接口地址**: `GET /api/analysis/knowledge/search`

**查询参数**:
- `query` - 搜索关键词（必填）
- `category` - 分类筛选（psychology, career, personality等）
- `tags` - 标签筛选（逗号分隔）
- `limit` - 结果数量（默认10）

**示例**: `/api/analysis/knowledge/search?query=MBTI&category=psychology&limit=5`

#### 导入文件到知识库
**接口地址**: `POST /api/analysis/knowledge/import/file`

```json
{
  "filePath": "./docs/psychology-handbook.md",
  "category": "psychology",
  "tags": ["handbook", "reference", "mbti"]
}
```

#### 从URL导入内容
**接口地址**: `POST /api/analysis/knowledge/import/url`

```json
{
  "url": "https://www.psychologytoday.com/intl/basics/big-5-personality-traits",
  "category": "research",
  "tags": ["big5", "research", "web"]
}
```

#### 获取知识库统计
**接口地址**: `GET /api/analysis/knowledge/stats`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "totalSources": 8,
    "totalEntries": 42,
    "categories": ["psychology", "career", "personality"],
    "lastUpdated": "2024-06-11T14:30:00Z"
  }
}
```

### 8.4 分析历史管理

#### 获取用户分析历史
**接口地址**: `GET /api/analysis/user/:userId/history`

#### 删除分析记录
**接口地址**: `DELETE /api/analysis/:analysisId`

---

## 9. 前端可视化集成

生成的`visualizationData`可以直接用于前端图表库（如Chart.js、ECharts等）：

```javascript
// 使用Chart.js渲染人格雷达图
function renderPersonalityChart(chartData) {
  const ctx = document.getElementById('personalityChart').getContext('2d');
  new Chart(ctx, chartData.personalityChart);
}

// 使用ECharts渲染职业匹配图
function renderCareerChart(chartData) {
  const chart = echarts.init(document.getElementById('careerChart'));
  chart.setOption({
    title: { text: '职业匹配度分析' },
    ...chartData.careerFitChart
  });
}
```

---

## 10. 知识库初始化

### 快速开始

```bash
# 1. 初始化知识库
npm run knowledge:init

# 2. 查看知识库状态
npm run knowledge:stats

# 3. 启动服务器
npm start
```

### 环境配置

需要在`.env.local`中配置：

```env
# OpenAI配置（必需）
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini

# 知识库配置
KNOWLEDGE_BASE_PATH=./knowledge-base
ENABLE_WEB_SCRAPING=true
```

---

## 更新日志

- **v2.0.0** - 🚀 重大更新：AI分析系统上线
  - 集成OpenAI GPT-4o-mini模型
  - MCP知识库服务支持文件/URL导入
  - 生成详细的心理测评分析报告
  - 可视化数据支持多种图表类型
  - 智能职业推荐和发展规划

- **v1.2.0** - 添加输入参数日志记录，优化调试体验
- **v1.1.0** - 增强数据验证和错误处理，添加详细的缺失字段信息  
- **v1.0.0** - 初始版本，支持用户信息管理和答案提交

---

如有疑问或需要技术支持，请联系开发团队。 