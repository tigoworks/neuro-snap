const axios = require('axios');

// API配置
const API_BASE_URL = 'http://localhost:8080';
const FRONTEND_API_KEY = 'test-frontend-key-123'; // 从.env文件中读取的密钥

async function testKnowledgeAPI() {
  console.log('🧪 开始测试知识库API...\n');

  try {
    // 1. 测试健康检查
    console.log('1. 测试健康检查...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ 健康检查通过:', healthResponse.data.status);

    // 2. 测试知识库统计
    console.log('\n2. 测试知识库统计...');
    const statsResponse = await axios.get(`${API_BASE_URL}/api/knowledge/stats`, {
      headers: {
        'X-Frontend-Key': FRONTEND_API_KEY
      }
    });
    console.log('✅ 知识库统计:', statsResponse.data);

    // 3. 测试搜索公司价值观
    console.log('\n3. 测试搜索公司价值观...');
    const searchResponse = await axios.get(`${API_BASE_URL}/api/knowledge/search`, {
      headers: {
        'X-Frontend-Key': FRONTEND_API_KEY
      },
      params: {
        query: '客户情绪',
        modelTag: 'company_values'
      }
    });
    console.log('✅ 搜索结果:', searchResponse.data);

    // 4. 测试获取特定模型的知识
    console.log('\n4. 测试获取公司价值观知识...');
    const modelResponse = await axios.get(`${API_BASE_URL}/api/knowledge/model/company_values`, {
      headers: {
        'X-Frontend-Key': FRONTEND_API_KEY
      }
    });
    console.log('✅ 公司价值观数据:', {
      success: modelResponse.data.success,
      count: modelResponse.data.data?.length || 0,
      firstItem: modelResponse.data.data?.[0]?.title || 'N/A'
    });

    console.log('\n🎉 所有测试通过！知识库API工作正常。');

  } catch (error) {
    console.error('❌ 测试失败:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

// 运行测试
testKnowledgeAPI(); 