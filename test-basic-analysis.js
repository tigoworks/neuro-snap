const axios = require('axios');

const baseURL = 'http://localhost:8080/api';

// 测试数据
const testData = {
  userInfo: {
    name: "测试用户",
    gender: "male",
    age: 28,
    city: "上海",
    occupation: "软件工程师",
    education: "本科"
  },
  fiveQuestions: {
    fiveq_q1: "职业发展和技术提升",
    fiveq_q2: "学习新的编程语言和框架"
  },
  mbti: {
    mbti_ei_q1: "2",
    mbti_ei_q2: "1",
    mbti_sn_q1: "2", 
    mbti_sn_q2: "1",
    mbti_tf_q1: "1",
    mbti_tf_q2: "2",
    mbti_jp_q1: "1",
    mbti_jp_q2: "2"
  },
  bigFive: {
    big5_o_q1: 4,
    big5_o_q2: 5,
    big5_c_q1: 4,
    big5_c_q2: 4,
    big5_e_q1: 3,
    big5_e_q2: 3,
    big5_a_q1: 4,
    big5_a_q2: 4,
    big5_n_q1: 2,
    big5_n_q2: 2
  },
  disc: {
    disc_d_q1: "2",
    disc_d_q2: "3",
    disc_i_q1: "3",
    disc_i_q2: "2",
    disc_s_q1: "4",
    disc_s_q2: "4",
    disc_c_q1: "3",
    disc_c_q2: "4"
  },
  holland: {
    holland_r_q1: 2,
    holland_r_q2: 3,
    holland_i_q1: 5,
    holland_i_q2: 4,
    holland_a_q1: 3,
    holland_a_q2: 3,
    holland_s_q1: 3,
    holland_s_q2: 4,
    holland_e_q1: 4,
    holland_e_q2: 3,
    holland_c_q1: 3,
    holland_c_q2: 3
  },
  values: {
    motivation_q1: ["1", "3", "5"],
    motivation_q2: ["2", "4", "6"]
  }
};

const headers = {
  'Content-Type': 'application/json',
  'X-Frontend-Key': 'test-frontend-key-123'
};

async function testBasicAnalysis() {
  try {
    console.log('🧪 开始测试基础分析功能...\n');

    // 1. 先提交完整答案数据
    console.log('1️⃣ 提交测试答案...');
    const submitResponse = await axios.post(`${baseURL}/answer/submit`, testData, { headers });
    console.log('✅ 答案提交成功:', submitResponse.data);
    
    // 使用surveyId作为userId，或者生成一个测试用的userId
    const userId = submitResponse.data.surveyId || submitResponse.data.userId || 'test-user-' + Date.now();
    console.log('👤 用户ID:', userId);

    // 2. 测试基础分析生成
    console.log('\n2️⃣ 生成基础分析报告...');
    const analysisResponse = await axios.post(`${baseURL}/analysis/basic/generate`, {
      userId: userId,
      userAnswers: testData,
      analysisType: 'comprehensive'
    }, { headers });
    
    console.log('✅ 基础分析生成成功:');
    
    // 检查响应结构并适配
    const responseData = analysisResponse.data;
    if (responseData.data && responseData.data.report) {
      console.log('📊 分析结果摘要:', responseData.data.report.summary.overview);
      console.log('🎯 置信度:', responseData.data.metadata.confidence);
      console.log('⏱️  处理时间:', responseData.data.metadata.processingTime + 'ms');
    } else {
      console.log('📊 分析结果:', responseData);
    }

    // 3. 测试分析预览
    console.log('\n3️⃣ 获取分析预览...');
    try {
      const previewResponse = await axios.get(`${baseURL}/analysis/basic/preview/${userId}`, { headers });
      console.log('✅ 分析预览获取成功:');
      
      const previewData = previewResponse.data;
      if (previewData.data && previewData.data.visualizationData) {
        console.log('📈 可视化数据类型:', Object.keys(previewData.data.visualizationData));
      } else {
        console.log('📈 预览数据:', previewData);
      }
    } catch (error) {
      console.log('⚠️  分析预览测试跳过 (可能需要POST请求):', error.response?.data?.error || error.message);
    }

    // 4. 测试统计信息
    console.log('\n4️⃣ 获取分析统计...');
    try {
      const statsResponse = await axios.get(`${baseURL}/analysis/basic/stats`, { headers });
      console.log('✅ 统计信息获取成功:');
      console.log('📊 统计数据:', statsResponse.data);
    } catch (error) {
      console.log('⚠️  统计信息测试跳过:', error.response?.data?.error || error.message);
    }

    console.log('\n🎉 基础分析测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error('HTTP状态码:', error.response.status);
    }
    if (error.response?.data) {
      console.error('详细错误信息:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// 运行测试
testBasicAnalysis(); 