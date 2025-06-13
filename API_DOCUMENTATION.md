# Neuro-Snap API 接口文档

## 📋 概述

Neuro-Snap 是一个基于AI的心理测评和职业分析系统，提供完整的测评流程和个性化分析报告。系统集成了**AI增强分析**功能，包括成长周期预测、未来成就分析和个性化发展路径规划。

**Base URL**: `http://localhost:8080/api`  
**认证方式**: X-Frontend-Key Header  
**数据格式**: JSON  
**AI分析引擎**: GPT-4o with Enhanced Analysis

## 🔐 认证

**重要**：所有API请求都需要在Header中包含前端密钥：

```http
X-Frontend-Key: test-frontend-key-123
Content-Type: application/json
```

**当前配置的前端密钥**：`test-frontend-key-123`

如果没有提供正确的前端密钥，会收到以下错误：
```json
{
  "error": "Frontend API key required",
  "code": "MISSING_FRONTEND_KEY"
}
```

或者：
```json
{
  "error": "Invalid frontend API key", 
  "code": "INVALID_FRONTEND_KEY"
}
```

## 📊 系统状态接口

### 1. 检查AI服务状态

**接口**: `GET /ai/status`  
**描述**: 检查AI分析服务是否可用

**响应示例**:
```json
{
  "success": true,
  "data": {
    "ai": {
      "available": true,
      "model": "gpt-4o",
      "provider": "OpenAI",
      "features": [
        "基础心理分析",
        "成长周期预测", 
        "未来成就分析",
        "发展路径规划"
      ]
    },
    "timestamp": "2025-06-12T08:09:37.684Z",
    "environment": "development"
  }
}
```

### 2. 检查系统健康状态

**接口**: `GET /ai/health`  
**描述**: 获取系统整体健康状态

**响应示例**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "services": {
      "database": "healthy",
      "ai": "available",
      "proxy": "connected",
      "knowledgeBase": "loaded"
    },
    "timestamp": "2025-06-12T08:09:37.684Z"
  }
}
```

## 📝 测评题目接口

### 3. 获取测评题目

**接口**: `GET /survey-questions?model={modelType}`  
**描述**: 获取指定测评模型的所有题目

**参数**:
- `model` (string): 测评模型代码
  - `fiveq`: 五问法快速画像
  - `mbti`: MBTI人格测试
  - `big5`: 五大人格测试
  - `disc`: DISC行为风格测试
  - `holland`: 霍兰德职业兴趣测试
  - `motivation`: 动机与价值观测试

**响应示例**:
```json
{
  "model": {
    "id": "91e7c1c7-3708-4ec0-8152-785d072ac2ed",
    "name": "MBTI 简化测试",
    "description": "4 维度×2 道题"
  },
  "questions": [
    {
      "id": "4edc47ad-0a9a-4070-ab59-6e56014e6f15",
      "question_code": "mbti_ei_q1",
      "content": "在聚会中，你更喜欢：",
      "options": [
        {"code": "1", "label": "与大多数人交谈"},
        {"code": "2", "label": "与几位好友深入交谈"}
      ],
      "type": "single",
      "sort_order": 1,
      "required": true
    }
  ]
}
```

## 📤 答案提交接口

### 4. 提交测试答案（AI增强分析）

**接口**: `POST /submit-test`  
**描述**: 提交完整的测试答案，触发AI增强分析（包含成长周期预测和未来成就分析）

**请求体**:
```json
{
  "userInfo": {
    "name": "张三",
    "gender": "男",
    "age": 28,
    "city": "北京",
    "occupation": "软件工程师",
    "education": "本科",
    "phone": "13800138000"
  },
  "fiveQuestions": {
    "fiveq_q1": "1",
    "fiveq_q2": "2",
    "fiveq_q3": "1",
    "fiveq_q4": "2",
    "fiveq_q5": "1"
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
    "bigfive_openness_q1": "4",
    "bigfive_openness_q2": "3",
    "bigfive_conscientiousness_q1": "4",
    "bigfive_conscientiousness_q2": "4",
    "bigfive_extraversion_q1": "3",
    "bigfive_extraversion_q2": "2",
    "bigfive_agreeableness_q1": "4",
    "bigfive_agreeableness_q2": "4",
    "bigfive_neuroticism_q1": "2",
    "bigfive_neuroticism_q2": "3"
  },
  "disc": {
    "disc_d_q1": "4",
    "disc_d_q2": "3",
    "disc_i_q1": "3",
    "disc_i_q2": "4",
    "disc_s_q1": "2",
    "disc_s_q2": "3",
    "disc_c_q1": "4",
    "disc_c_q2": "3"
  },
  "holland": {
    "holland_realistic_q1": "3",
    "holland_realistic_q2": "2",
    "holland_realistic_q3": "3",
    "holland_investigative_q1": "4",
    "holland_investigative_q2": "4",
    "holland_investigative_q3": "4",
    "holland_artistic_q1": "2",
    "holland_artistic_q2": "3",
    "holland_artistic_q3": "2",
    "holland_social_q1": "3",
    "holland_social_q2": "3",
    "holland_social_q3": "3",
    "holland_enterprising_q1": "3",
    "holland_enterprising_q2": "4",
    "holland_enterprising_q3": "3",
    "holland_conventional_q1": "2",
    "holland_conventional_q2": "2",
    "holland_conventional_q3": "3"
  },
  "values": {
    "values_achievement": { "order": [1, 2, 3, 4, 5] },
    "values_support": { "order": [2, 1, 4, 3, 5] },
    "values_comfort": { "order": [3, 4, 1, 2, 5] },
    "values_autonomy": { "order": [1, 3, 2, 4, 5] },
    "values_security": { "order": [2, 3, 4, 1, 5] },
    "values_prestige": { "order": [4, 5, 2, 3, 1] }
  }
}
```

**响应示例**:
```json
{
  "message": "测试结果保存成功，分析正在后台进行",
  "surveyId": "d07d1da0-cacd-4a15-b35c-c305a0afb305",
  "stats": {
    "totalAnswers": 46,
    "answersByType": {
      "fiveq": 5,
      "mbti": 8,
      "big5": 10,
      "disc": 8,
      "holland": 18,
      "motivation": 6
    },
    "duration": "156ms"
  },
  "analysis": {
    "status": "processing",
    "message": "分析报告正在生成中，请稍后查看结果",
    "estimatedCompletion": "通常需要30-60秒"
  }
}
```

## 📊 AI增强分析结果接口

### 5. 获取AI增强分析结果

**接口**: `GET /analysis-result/user/{surveyId}`  
**描述**: 获取用户的AI增强分析结果，包含成长周期预测和未来成就分析

**参数**:
- `surveyId` (string): 提交测试后返回的用户ID

**响应示例** (分析完成):
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "analysis": {
      "id": "57e580c9-7b50-4ff6-b521-102e95a7a383",
      "userId": "d07d1da0-cacd-4a15-b35c-c305a0afb305",
      "analysisType": "comprehensive",
      "summary": "张三是一位潜力无限的软件工程师，正处于职业生涯的探索期，逐渐向建立期过渡。他表现出强烈的逻辑思考和独立性，适合追求技术深度和创新性项目。",
      "confidenceScore": 90,
      "processingTime": 33362,
      "modelCode": "AI-powered",
      "createdAt": "2025-06-12T13:35:35.923+00:00",
      "detailedAnalysis": {
        "personalProfile": {
          "basicInfo": "张三，28岁，软件工程师，本科毕业，现居北京。",
          "careerStage": "目前处于职业生涯的探索期，向建立期过渡中。",
          "demographics": "张三属于城市白领，处于职业发展的早期阶段，具有良好的教育背景和职业起步。"
        },
        "testResults": {
          "personality": "MBTI显示为INTJ，具有内向、直觉、思考、判断的特质，偏爱独立工作和逻辑分析。",
          "behaviorStyle": "DISC测试表明，张三在团队中表现出一定的领导意愿和规则意识，适合在结构化环境中工作。",
          "interests": "霍兰德测试未提供具体信息，但张三可能倾向于研究型和常规型职业。",
          "values": "张三重视个人成长和技术成就，可能欣赏有远见和技术专长的人。",
          "careerDevelopment": "倾向于关注技术细节和创新，适合从事需要深度思考和规划的技术型工作。"
        },
        "growthCycle": {
          "currentStage": "当前成长阶段：探索期",
          "cycleDuration": "预计探索期将持续2-3年。",
          "nextStagePreview": "下一阶段是建立期，需集中于技能深化与职业定位。",
          "transitionSignals": [
            "对当前工作的深度兴趣增加",
            "开始关注长期职业规划"
          ],
          "stageSpecificGoals": [
            "提升专业技术技能",
            "建立职场网络",
            "探索职业兴趣和方向"
          ],
          "stageCharacteristics": "探索期的主要特征是寻找职业方向，尝试不同的工作角色和积累经验。"
        },
        "futureAchievements": {
          "shortTermPotential": {
            "timeframe": "1-2年内",
            "achievableGoals": [
              "获取一个高级技术认证",
              "参与关键项目的开发"
            ],
            "successProbability": 85
          },
          "mediumTermPotential": {
            "timeframe": "3-5年内",
            "achievableGoals": [
              "晋升为技术主管",
              "承担独立项目管理责任"
            ],
            "successProbability": 75
          },
          "longTermPotential": {
            "timeframe": "5-10年内",
            "achievableGoals": [
              "成为技术领域专家",
              "在行业会议上发表演讲"
            ],
            "successProbability": 70
          },
          "peakPotential": {
            "timeframe": "职业生涯巅峰期",
            "legacyImpact": "可能在技术领域做出突破性贡献，影响下一代工程师。",
            "realizationFactors": [
              "持续学习",
              "创新能力",
              "行业网络"
            ],
            "ultimateAchievements": [
              "技术创新领军人物",
              "建立技术影响力"
            ]
          }
        },
        "developmentPathway": {
          "criticalSkills": [
            "高级编程技能",
            "项目管理能力",
            "沟通技巧"
          ],
          "experienceGaps": [
            "国际项目经验",
            "跨部门合作经验"
          ],
          "learningPriorities": [
            "技术认证课程",
            "领导力培训",
            "行业趋势分析"
          ],
          "mentorshipNeeds": "需要寻求在技术和管理方面的双重导师指导。",
          "networkingStrategy": "参加行业会议和技术社区活动，扩大专业网络。",
          "riskFactors": [
            "技术变化速度快",
            "职业倦怠风险"
          ],
          "mitigationStrategies": [
            "持续学习更新",
            "保持工作与生活平衡"
          ]
        },
        "culturalFit": {
          "fitScore": 80,
          "matchingValues": "创新、效率、专业成长",
          "developmentAreas": [
            "团队协作",
            "灵活性适应"
          ]
        },
        "strengthsAndWeaknesses": {
          "strengths": [
            "逻辑分析能力",
            "自我驱动力",
            "技术专长"
          ],
          "weaknesses": [
            "可能的沟通障碍",
            "对变化的适应性"
          ],
          "actionPlan": [
            "加强沟通技巧",
            "参与团队建设活动",
            "定期反思与调整"
          ]
        },
        "careerRecommendations": [
          "专注于技术领域的深耕",
          "扩展管理技能",
          "参与行业交流"
        ],
        "developmentSuggestions": [
          "定期设定职业目标",
          "寻求成长性项目参与",
          "建立个人品牌"
        ]
      },
      "recommendations": [
        "参加高级技术课程以提升专业能力。",
        "参与技术社区，拓展行业人脉。",
        "寻找职业导师以获得指导和支持。",
        "设定短期和长期的职业目标并定期评估。",
        "参与跨部门项目以增强综合能力。",
        "关注行业趋势，保持技术前沿性。",
        "定期进行职业发展评估，调整策略。"
      ],
      "knowledgeSources": [
        "MBTI基础理论",
        "五大人格理论", 
        "DISC行为风格",
        "霍兰德职业兴趣理论",
        "成长周期分析理论",
        "未来成就预测模型"
      ]
    }
  }
}
```

**响应示例** (分析进行中):
```json
{
  "success": true,
  "data": {
    "status": "processing",
    "message": "分析正在进行中，已用时1分钟",
    "submittedAt": "2025-06-12T13:35:00.000Z",
    "elapsedTime": "1分钟",
    "estimatedCompletion": "通常需要2-5分钟"
  }
}
```

### 6. 获取分析历史

**接口**: `GET /analysis-result/user/{userId}/history?limit=10&offset=0`  
**描述**: 获取用户的分析历史记录

**参数**:
- `userId` (string): 用户ID
- `limit` (number, 可选): 返回记录数，默认10
- `offset` (number, 可选): 偏移量，默认0

**响应示例**:
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "57e580c9-7b50-4ff6-b521-102e95a7a383",
        "summary": "张三是一位潜力无限的软件工程师，正处于职业生涯的探索期...",
        "confidenceScore": 90,
        "processingTime": 33362,
        "createdAt": "2025-06-12T13:35:35.923+00:00",
        "modelCode": "AI-powered",
        "analysisType": "comprehensive"
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 10,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

### 7. 获取分析摘要

**接口**: `GET /analysis-result/user/{userId}/summary`  
**描述**: 获取用户分析的简要摘要

**响应示例**:
```json
{
  "success": true,
  "data": {
    "userInfo": {
      "name": "张三",
      "age": 28,
      "occupation": "软件工程师",
      "education": "本科"
    },
    "analysisOverview": {
      "summary": "张三是一位潜力无限的软件工程师，正处于职业生涯的探索期...",
      "confidenceScore": 90,
      "recommendationsCount": 7,
      "knowledgeSourcesCount": 6,
      "processingTime": 33362,
      "createdAt": "2025-06-12T13:35:35.923+00:00",
      "analysisFeatures": [
        "成长周期分析",
        "未来成就预测", 
        "发展路径规划",
        "文化匹配度评估"
      ]
    },
    "keyInsights": {
      "currentGrowthStage": "探索期",
      "nextStageTimeline": "2-3年",
      "shortTermSuccessProbability": 85,
      "primaryStrengths": ["逻辑分析能力", "自我驱动力", "技术专长"],
      "developmentPriorities": ["技术认证课程", "领导力培训", "行业趋势分析"]
    },
    "keyRecommendations": [
      "参加高级技术课程以提升专业能力。",
      "参与技术社区，拓展行业人脉。",
      "寻找职业导师以获得指导和支持。"
    ],
    "nextSteps": [
      "查看详细分析报告",
      "制定个人发展计划",
      "定期回顾和调整目标"
    ]
  }
}
```

## 🔄 前端集成示例

### 完整的AI增强测评流程

```javascript
class NeuroSnapAPI {
  constructor(baseURL, frontendKey) {
    this.baseURL = baseURL;
    this.headers = {
      'Content-Type': 'application/json',
      'X-Frontend-Key': frontendKey
    };
  }

  // 1. 检查AI服务状态
  async checkAIStatus() {
    const response = await fetch(`${this.baseURL}/ai/status`, {
      headers: this.headers
    });
    return response.json();
  }

  // 2. 获取测评题目
  async getSurveyQuestions(modelCode) {
    const response = await fetch(`${this.baseURL}/survey-questions?model=${modelCode}`, {
      headers: this.headers
    });
    return response.json();
  }

  // 3. 提交测试答案
  async submitTest(testData) {
    const response = await fetch(`${this.baseURL}/submit-test`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(testData)
    });
    return response.json();
  }

  // 4. 智能轮询获取AI增强分析结果（推荐使用）
  async pollAnalysisResult(userId, maxAttempts = 10, intervalMs = 3000) {
    console.log(`🔍 开始轮询AI增强分析结果 (最多${maxAttempts}次尝试)`);
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`${this.baseURL}/analysis-result/user/${userId}`, {
          headers: this.headers
        });
        
        if (response.status === 429) {
          // 处理速率限制
          const retryAfter = 60000; // 等待60秒
          console.warn(`遇到速率限制，等待${retryAfter / 1000}秒后重试...`);
          await new Promise(resolve => setTimeout(resolve, retryAfter));
          continue;
        }
        
        const result = await response.json();
        
        if (result.success && result.data.status === 'completed') {
          console.log('✅ AI增强分析完成！');
          return result.data.analysis;
        }
        
        if (result.success && result.data.status === 'processing') {
          console.log(`⏳ ${result.data.message}`);
        }
        
        // 等待下次轮询
        const remainingAttempts = maxAttempts - i - 1;
        if (remainingAttempts > 0) {
          console.log(`⏳ ${Math.round(intervalMs / 1000)}秒后重试... (剩余${remainingAttempts}次)`);
          await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
        
      } catch (error) {
        if (i === maxAttempts - 1) throw error;
        
        console.warn(`请求出错，${intervalMs / 1000}秒后重试: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
    
    throw new Error('AI分析超时，请稍后手动查看结果');
  }

  // 5. 获取分析历史
  async getAnalysisHistory(userId, limit = 10, offset = 0) {
    const response = await fetch(
      `${this.baseURL}/analysis-result/user/${userId}/history?limit=${limit}&offset=${offset}`,
      { headers: this.headers }
    );
    return response.json();
  }

  // 6. 获取分析摘要
  async getAnalysisSummary(userId) {
    const response = await fetch(
      `${this.baseURL}/analysis-result/user/${userId}/summary`,
      { headers: this.headers }
    );
    return response.json();
  }
}

// 使用示例：完整的AI增强测评流程
const api = new NeuroSnapAPI('http://localhost:8080/api', 'your-frontend-key');

async function runCompleteAIAnalysis() {
  try {
    // 1. 检查AI状态
    const aiStatus = await api.checkAIStatus();
    if (!aiStatus.data.ai.available) {
      throw new Error('AI服务不可用');
    }
    console.log('✅ AI服务可用，支持功能:', aiStatus.data.ai.features);

    // 2. 准备完整测试数据（7个测试模块）
    const completeTestData = {
      userInfo: {
        name: "测试用户",
        gender: "男",
        age: 28,
        city: "北京",
        occupation: "软件工程师",
        education: "本科"
      },
      fiveQuestions: { /* 五问法答案 */ },
      mbti: { /* MBTI答案 */ },
      bigFive: { /* 五大人格答案 */ },
      disc: { /* DISC答案 */ },
      holland: { /* 霍兰德答案 */ },
      values: { /* 价值观答案 */ }
    };
    
    // 3. 提交测试数据
    const submitResult = await api.submitTest(completeTestData);
    const userId = submitResult.surveyId;
    console.log('✅ 测试提交成功，用户ID:', userId);
    
    // 4. 等待AI增强分析完成
    const analysisResult = await api.pollAnalysisResult(userId);
    
    // 5. 展示AI增强分析结果
    console.log('🎉 AI增强分析完成!');
    console.log('📊 置信度:', analysisResult.confidenceScore);
    console.log('🔄 成长阶段:', analysisResult.detailedAnalysis.growthCycle.currentStage);
    console.log('🎯 短期成功概率:', analysisResult.detailedAnalysis.futureAchievements.shortTermPotential.successProbability + '%');
    console.log('💡 关键建议:', analysisResult.recommendations.slice(0, 3));
    
    return analysisResult;
    
  } catch (error) {
    console.error('AI增强分析失败:', error);
  }
}
```

## 🧠 AI增强分析特性

### 成长周期分析 (Growth Cycle Analysis)
- **当前阶段识别**: 探索期、建立期、维持期、衰退期
- **阶段持续时间预测**: 基于个人特质的时间预估
- **转换信号**: 进入下一阶段的关键指标
- **阶段特定目标**: 当前阶段应重点关注的发展方向

### 未来成就预测 (Future Achievement Prediction)
- **短期潜力** (1-2年): 85%+ 成功概率的目标
- **中期潜力** (3-5年): 75%+ 成功概率的目标  
- **长期潜力** (5-10年): 70%+ 成功概率的目标
- **巅峰潜力**: 职业生涯最高成就预测和影响力评估

### 发展路径规划 (Development Pathway)
- **关键技能识别**: 职业发展必需的核心能力
- **经验缺口分析**: 当前经验与目标差距
- **学习优先级**: 个性化的学习建议排序
- **风险因素**: 职业发展可能面临的挑战
- **缓解策略**: 针对性的风险应对方案

## ❌ 错误处理

### 常见错误码

- `MISSING_USER_ID`: 缺少用户ID
- `MISSING_ANALYSIS_ID`: 缺少分析ID
- `ANALYSIS_NOT_FOUND`: 分析结果不存在
- `ANALYSIS_FETCH_FAILED`: 获取分析结果失败
- `ANALYSIS_SUMMARY_FAILED`: 获取分析摘要失败
- `INCOMPLETE_DATA`: 测试数据不完整（缺少必需的测试模块）
- `AI_SERVICE_UNAVAILABLE`: AI分析服务不可用

### 错误响应格式

```json
{
  "error": "错误描述",
  "details": "详细错误信息",
  "code": "ERROR_CODE",
  "suggestions": ["建议1", "建议2"]
}
```

## 📈 性能指标

- **AI分析时间**: 通常30-60秒
- **置信度**: 85-95%（AI增强分析）
- **成功概率预测准确性**: 基于大量数据训练优化
- **并发支持**: 支持多用户同时进行AI分析
- **数据持久化**: 所有结果永久保存
- **知识库**: 6个专业理论模型支撑

## 🔒 安全说明

1. 所有API都需要有效的前端密钥
2. 用户数据加密存储
3. 支持HTTPS传输
4. 定期备份分析结果
5. AI分析过程中的隐私保护

## 📚 知识库支撑

AI增强分析基于以下专业理论：
- MBTI基础理论
- 五大人格理论
- DISC行为风格
- 霍兰德职业兴趣理论
- **成长周期分析理论** (新增)
- **未来成就预测模型** (新增)

---

**更新时间**: 2025-06-12  
**API版本**: v2.0 (AI Enhanced)  
**联系方式**: 如有问题请联系开发团队 