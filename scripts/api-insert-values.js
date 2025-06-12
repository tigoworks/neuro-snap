const axios = require('axios');

// API配置
const API_BASE_URL = 'http://localhost:8080';
const FRONTEND_API_KEY = 'neuro-snap-frontend-2024'; // 从日志中看到的密钥

// 钛果公司价值观数据
const taiguoValues = [
  {
    title: '客户情绪为先',
    description: '营造一个良好的合作关系，追求初期良好的合作意愿度',
    whatIs: '良好的客户情绪是建立合作意愿度的开端',
    whyImportant: '真心实意把客户当朋友',
    howToDo: '始终以客户情绪为优先考虑'
  },
  {
    title: '合作共赢为本',
    description: '建立长期稳定的合作关系，实现多方共赢',
    whatIs: '以合作共赢为核心理念的商业模式',
    whyImportant: '只有共赢才能建立长久的合作关系',
    howToDo: '在每个合作中寻找多方利益平衡点'
  },
  {
    title: '真实诚信',
    description: '以诚待人，言行一致，建立可信赖的品牌形象',
    whatIs: '诚实守信是企业立身之本',
    whyImportant: '诚信是建立信任关系的基础',
    howToDo: '在所有商业活动中保持透明和诚实'
  },
  {
    title: '刨根问底',
    description: '深入思考问题本质，不满足于表面现象',
    whatIs: '追求问题根本原因的思维方式',
    whyImportant: '只有找到根本原因才能彻底解决问题',
    howToDo: '对每个问题都要问为什么，直到找到根本原因'
  },
  {
    title: '结果导向',
    description: '以最终结果为目标，注重执行效果',
    whatIs: '以达成目标结果为工作导向',
    whyImportant: '结果是检验工作成效的唯一标准',
    howToDo: '制定明确目标，专注执行，确保达成结果'
  },
  {
    title: '自驱自省',
    description: '主动承担责任，持续自我反思和改进',
    whatIs: '自我驱动和自我反省的能力',
    whyImportant: '自驱自省是个人成长的内在动力',
    howToDo: '主动设定目标，定期反思总结，持续改进'
  },
  {
    title: '乐观勇敢',
    description: '保持积极心态，勇于面对挑战',
    whatIs: '积极乐观的心态和勇于挑战的精神',
    whyImportant: '乐观勇敢是克服困难的精神力量',
    howToDo: '面对困难时保持乐观，勇于尝试新的解决方案'
  },
  {
    title: '追求极致',
    description: '不断追求完美，力求做到最好',
    whatIs: '对品质和效果的极致追求',
    whyImportant: '极致的追求才能创造卓越的成果',
    howToDo: '在每个细节上都力求完美，不断优化改进'
  },
  {
    title: '相信相信',
    description: '相信团队，相信未来，相信可能性',
    whatIs: '对团队和未来的坚定信念',
    whyImportant: '相信是一切成功的前提',
    howToDo: '给予团队充分信任，对未来保持信心'
  },
  {
    title: '以终为始',
    description: '从目标出发，倒推执行路径',
    whatIs: '以最终目标为起点的思维方式',
    whyImportant: '明确终点才能找到最佳路径',
    howToDo: '先确定最终目标，再制定实现路径'
  },
  {
    title: '同心同德',
    description: '团队协作，目标一致，共同努力',
    whatIs: '团队成员心往一处想，劲往一处使',
    whyImportant: '团结一致是团队成功的关键',
    howToDo: '建立共同目标，加强沟通协作'
  },
  {
    title: '正向影响',
    description: '传播正能量，产生积极影响',
    whatIs: '通过自身行为产生正面影响力',
    whyImportant: '正向影响能够创造更好的环境',
    howToDo: '以身作则，传播正能量，影响他人'
  },
  {
    title: '防区延伸',
    description: '主动扩大责任范围，承担更多职责',
    whatIs: '主动承担超出职责范围的工作',
    whyImportant: '防区延伸体现主人翁精神',
    howToDo: '主动关注相关领域，承担额外责任'
  }
];

async function insertTaiguoValuesViaAPI() {
  try {
    console.log('🚀 开始通过API插入钛果价值观数据...');
    console.log(`📊 准备插入 ${taiguoValues.length} 条价值观数据`);

    // 创建axios实例
    const api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'X-Frontend-Key': FRONTEND_API_KEY
      }
    });

    // 测试API连接
    console.log('🔍 测试API连接...');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/health`);
      console.log('✅ API连接正常');
    } catch (error) {
      console.error('❌ API连接失败:', error.message);
      return;
    }

    // 尝试通过API插入数据
    console.log('📥 通过API插入钛果价值观数据...');
    
    const response = await api.post('/api/knowledge/company-values', {
      companyName: '钛果',
      values: taiguoValues
    });

    if (response.data.success) {
      console.log('✅ 成功插入钛果价值观数据');
      console.log(`📊 插入了 ${response.data.count || taiguoValues.length} 条数据`);
      
      // 验证插入结果
      console.log('🔍 验证插入结果...');
      try {
        const statsResponse = await api.get('/api/knowledge/stats');
        console.log('📊 知识库统计:', statsResponse.data);
      } catch (error) {
        console.log('⚠️  无法获取统计信息:', error.response?.data?.error || error.message);
      }
    } else {
      console.error('❌ 插入失败:', response.data.error);
    }

    console.log('\n🎉 钛果价值观数据插入完成！');
    console.log('💡 现在可以在AI分析中使用这些价值观数据了');

  } catch (error) {
    console.error('❌ 插入钛果价值观数据失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误详情:', error.message);
    }
  }
}

// 运行脚本
if (require.main === module) {
  insertTaiguoValuesViaAPI().catch(console.error);
}

module.exports = { insertTaiguoValuesViaAPI, taiguoValues }; 