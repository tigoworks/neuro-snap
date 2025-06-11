/**
 * Neuro-Snap Frontend SDK
 * 
 * 使用说明：
 * 1. 复制这个文件到你的前端项目
 * 2. 配置环境变量 NEXT_PUBLIC_API_BASE_URL 和 NEXT_PUBLIC_FRONTEND_API_KEY
 * 3. 导入并使用 NeuroSnapAPI 类
 * 
 * 示例：
 * import { neuroSnapAPI } from './frontend-sdk.js';
 * const questions = await neuroSnapAPI.getSurveyQuestions('mbti');
 */

class NeuroSnapAPI {
  constructor(baseURL, apiKey) {
    this.baseURL = baseURL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_FRONTEND_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️  请配置 NEXT_PUBLIC_FRONTEND_API_KEY 环境变量');
    }
  }

  /**
   * 通用API请求方法
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Frontend-Key': this.apiKey,
      'User-Agent': 'NeuroSnap-Frontend/1.0.0',
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // 检查响应状态
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // 如果无法解析错误响应，使用默认错误信息
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('API请求失败:', error);
      
      // 友好的错误信息映射
      if (error.message.includes('Failed to fetch')) {
        throw new Error('网络连接失败，请检查服务器是否启动');
      } else if (error.message.includes('401')) {
        throw new Error('API认证失败，请检查API Key配置');
      } else if (error.message.includes('403')) {
        throw new Error('访问被拒绝，请检查域名白名单配置');
      } else if (error.message.includes('429')) {
        throw new Error('请求过于频繁，请稍后再试');
      } else if (error.message.includes('500')) {
        throw new Error('服务器内部错误，请稍后重试');
      }
      
      throw error;
    }
  }

  /**
   * 保存用户信息
   * @param {Object} userInfo - 用户信息对象
   * @param {string} userInfo.name - 姓名
   * @param {string} userInfo.gender - 性别 ("male" | "female")
   * @param {number} userInfo.age - 年龄
   * @param {string} userInfo.city - 城市
   * @param {string} userInfo.occupation - 职业
   * @param {string} userInfo.education - 学历
   * @param {string} userInfo.phone - 手机号
   */
  async saveUserInfo(userInfo) {
    return this.request('/api/user/info', {
      method: 'POST',
      body: JSON.stringify(userInfo)
    });
  }

  /**
   * 获取用户信息
   * @param {string} userId - 用户ID
   */
  async getUserInfo(userId) {
    return this.request(`/api/user/info?userId=${userId}`);
  }

  /**
   * 获取测试题目
   * @param {string} modelCode - 测试类型代码
   * 支持的类型：fiveq, mbti, big5, disc, holland, motivation
   */
  async getSurveyQuestions(modelCode) {
    return this.request(`/api/survey/model?code=${modelCode}`);
  }

  /**
   * 获取所有测试类型
   */
  async getAllModels() {
    return this.request('/api/survey/models');
  }

  /**
   * 提交测试答案
   * @param {string} userId - 用户ID
   * @param {string} modelCode - 测试类型代码
   * @param {Object} answers - 答案对象
   * 
   * 答案格式说明：
   * - single (单选): "1"
   * - multiple (多选): ["1", "3", "5"]
   * - scale (打分): 4
   * - text (文本): "我的回答"
   * - sorting (排序): {"order": [2, 1, 4, 3, 5]}
   */
  async submitAnswers(userId, modelCode, answers) {
    return this.request('/api/answer/submit', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        modelCode,
        answers
      })
    });
  }

  /**
   * 触发AI分析
   * @param {Object} analysisRequest - 分析请求对象
   * @param {string} analysisRequest.modelType - 测试类型
   * @param {Array} analysisRequest.answers - 答案数组
   * @param {Array} analysisRequest.knowledgeBase - 知识库数据
   * @param {Object} analysisRequest.options - 分析选项
   */
  async triggerAnalysis(analysisRequest) {
    return this.request('/api/analysis/analyze', {
      method: 'POST',
      body: JSON.stringify(analysisRequest)
    });
  }

  /**
   * 获取分析状态
   * @param {string} surveyId - 调查ID
   */
  async getAnalysisStatus(surveyId) {
    return this.request(`/api/analysis/status/${surveyId}`);
  }

  /**
   * 轮询等待分析完成
   * @param {string} surveyId - 调查ID
   * @param {number} maxAttempts - 最大尝试次数，默认30次
   * @param {number} interval - 轮询间隔（毫秒），默认2秒
   */
  async waitForAnalysis(surveyId, maxAttempts = 30, interval = 2000) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const status = await this.getAnalysisStatus(surveyId);
        
        if (status.status === 'completed') {
          return status.result;
        } else if (status.status === 'error') {
          throw new Error(status.error || '分析过程中发生错误');
        }
        
        // 等待指定间隔后再次检查
        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        if (i === maxAttempts - 1) {
          throw error;
        }
        // 继续尝试
      }
    }
    
    throw new Error('分析超时，请稍后查看结果');
  }
}

// 创建默认实例
const neuroSnapAPI = new NeuroSnapAPI();

// React Hook 工具函数
const NeuroSnapHooks = {
  /**
   * 获取测试题目的 Hook
   * @param {string} modelCode - 测试类型代码
   */
  useSurveyQuestions: (modelCode) => {
    const [state, setState] = React.useState({
      questions: null,
      loading: true,
      error: null
    });

    React.useEffect(() => {
      if (!modelCode) return;

      const fetchQuestions = async () => {
        try {
          setState(prev => ({ ...prev, loading: true, error: null }));
          const data = await neuroSnapAPI.getSurveyQuestions(modelCode);
          setState({ questions: data, loading: false, error: null });
        } catch (error) {
          setState({ questions: null, loading: false, error: error.message });
        }
      };

      fetchQuestions();
    }, [modelCode]);

    return state;
  },

  /**
   * 提交答案的 Hook
   */
  useSubmitAnswers: () => {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    const submitAnswers = async (userId, modelCode, answers) => {
      try {
        setLoading(true);
        setError(null);
        const result = await neuroSnapAPI.submitAnswers(userId, modelCode, answers);
        return result;
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    };

    return { submitAnswers, loading, error };
  }
};

// 使用示例
const examples = {
  /**
   * 完整的测试流程示例
   */
  async completeTestFlow() {
    try {
      // 1. 保存用户信息
      const userResult = await neuroSnapAPI.saveUserInfo({
        name: "张三",
        gender: "male",
        age: 25,
        city: "北京",
        occupation: "软件工程师",
        education: "本科",
        phone: "13812345678"
      });
      
      console.log('用户信息已保存:', userResult);
      const userId = userResult.user_id;

      // 2. 获取测试题目
      const surveyData = await neuroSnapAPI.getSurveyQuestions('mbti');
      console.log('题目获取成功:', surveyData.questions.length + '道题');

      // 3. 模拟用户答题
      const answers = {};
      surveyData.questions.forEach(question => {
        // 简单的模拟答案，实际应该是用户的真实选择
        if (question.type === 'single') {
          answers[question.question_code] = "1";
        } else if (question.type === 'multiple') {
          answers[question.question_code] = ["1", "2"];
        } else if (question.type === 'scale') {
          answers[question.question_code] = 4;
        } else if (question.type === 'text') {
          answers[question.question_code] = "这是我的回答";
        }
      });

      // 4. 提交答案
      const submitResult = await neuroSnapAPI.submitAnswers(userId, 'mbti', answers);
      console.log('答案提交成功:', submitResult);

      return {
        userId,
        surveyId: submitResult.survey_id,
        success: true
      };
    } catch (error) {
      console.error('测试流程失败:', error);
      throw error;
    }
  },

  /**
   * React 组件使用示例
   */
  ReactComponent: `
function TestPage() {
  const [selectedModel, setSelectedModel] = useState('mbti');
  const { questions, loading, error } = NeuroSnapHooks.useSurveyQuestions(selectedModel);
  const { submitAnswers, loading: submitting } = NeuroSnapHooks.useSubmitAnswers();

  const handleSubmit = async (answers) => {
    try {
      const result = await submitAnswers(userId, selectedModel, answers);
      console.log('提交成功:', result);
    } catch (error) {
      console.error('提交失败:', error);
    }
  };

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div>
      <h1>{questions?.model.name}</h1>
      {questions?.questions.map(question => (
        <div key={question.id}>
          <p>{question.content}</p>
          {/* 渲染选项 */}
        </div>
      ))}
      <button onClick={handleSubmit} disabled={submitting}>
        {submitting ? '提交中...' : '提交答案'}
      </button>
    </div>
  );
}
  `
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 环境
  module.exports = { NeuroSnapAPI, neuroSnapAPI, NeuroSnapHooks, examples };
} else if (typeof window !== 'undefined') {
  // 浏览器环境
  window.NeuroSnapAPI = NeuroSnapAPI;
  window.neuroSnapAPI = neuroSnapAPI;
  window.NeuroSnapHooks = NeuroSnapHooks;
  window.neuroSnapExamples = examples;
}

// ES6 模块导出（如果支持）
export { NeuroSnapAPI, neuroSnapAPI, NeuroSnapHooks, examples }; 