const axios = require('axios');

// API配置
const API_BASE_URL = 'http://localhost:8080';
const FRONTEND_API_KEY = 'test-frontend-key-123';

// 拉卡拉企业文化数据
const lakalaCompanyCulture = [
  {
    title: '拉卡拉使命',
    description: '拉卡拉的企业使命和核心目标',
    whatIs: '为消费者创造价值，与创造者分享成果',
    whyImportant: '使命是企业存在的根本意义，指导企业的一切行为',
    howToDo: '在所有业务活动中始终以消费者价值为中心，与价值创造者共享成果',
    category: '企业使命',
    keywords: ['使命', '消费者价值', '创造者', '分享成果']
  },
  {
    title: '拉卡拉愿景',
    description: '拉卡拉的长远发展目标和企业愿景',
    whatIs: '成为一家行业数一数二、持续成长、受人尊重的企业',
    whyImportant: '愿景为企业发展提供方向和动力',
    howToDo: '通过持续创新和优质服务，在行业中保持领先地位',
    category: '企业愿景',
    keywords: ['愿景', '行业领先', '持续成长', '受人尊重']
  },
  {
    title: '拉卡拉 - 求实',
    description: '拉卡拉核心价值观之求实',
    whatIs: '刨根问底、结果导向、做十说九',
    whyImportant: '求实是做好一切工作的基础，确保决策和行动建立在事实基础上',
    howToDo: '凡事求甚解，任何事情都不能被表象所左右，必须搞清楚、搞准确，让每一句话都有经得起推敲的事实依据',
    category: '核心价值观',
    keywords: ['求实', '刨根问底', '结果导向', '做十说九', '事实依据']
  },
  {
    title: '拉卡拉 - 进取',
    description: '拉卡拉核心价值观之进取',
    whatIs: '主人心态、竭尽全力、日新月异',
    whyImportant: '进取精神是企业发展的动力源泉',
    howToDo: '以主人心态对待工作，竭尽全力完成目标，每天都在更新进步',
    category: '核心价值观',
    keywords: ['进取', '主人心态', '竭尽全力', '日新月异', '永不满足']
  },
  {
    title: '拉卡拉 - 创新',
    description: '拉卡拉核心价值观之创新',
    whatIs: '抓住需求、打破常规、聪明工作',
    whyImportant: '创新是企业保持竞争力的关键',
    howToDo: '紧盯用户需求，打破前人的方法，用更简单高效的方法达成目标',
    category: '核心价值观',
    keywords: ['创新', '抓住需求', '打破常规', '聪明工作', '用户需求']
  },
  {
    title: '拉卡拉 - 协同',
    description: '拉卡拉核心价值观之协同',
    whatIs: '向上思考、向下执行、防区延伸',
    whyImportant: '协同合作是实现组织目标的重要保障',
    howToDo: '以全局眼光思考问题，坚决执行决策，关注工作相接的上下左右游',
    category: '核心价值观',
    keywords: ['协同', '向上思考', '向下执行', '防区延伸', '全局思维']
  },
  {
    title: '拉卡拉 - 分享',
    description: '拉卡拉核心价值观之分享',
    whatIs: '同事与同事、公司与员工、公司与社会',
    whyImportant: '分享文化促进组织学习和社会责任履行',
    howToDo: '通过学习分享、利润分享、价值分享，实现多方共赢',
    category: '核心价值观',
    keywords: ['分享', '学习分享', '利润分享', '社会责任', '共赢']
  },
  {
    title: '拉卡拉管事四步法',
    description: '拉卡拉管理方法论中的管事四步法',
    whatIs: '先问目的、再做推演、亲手打样、及时复盘',
    whyImportant: '系统化的管事方法确保工作效率和质量',
    howToDo: '每个管理动作都按照四步法执行：明确目的→推演方案→打样验证→复盘总结',
    category: '管理方法论',
    keywords: ['管事四步法', '先问目的', '推演', '打样', '复盘']
  },
  {
    title: '拉卡拉管人四步法',
    description: '拉卡拉管理方法论中的管人四步法',
    whatIs: '设目标、控进度、抓考评、理规范',
    whyImportant: '规范化的管人方法确保团队执行力',
    howToDo: '通过设定清晰目标、控制工作进度、严格考评、建立规范来管理团队',
    category: '管理方法论',
    keywords: ['管人四步法', '设目标', '控进度', '抓考评', '理规范']
  },
  {
    title: '拉卡拉经营方法论',
    description: '拉卡拉高级管理方法论',
    whatIs: '建班子、定战略、带队伍',
    whyImportant: '经营方法论指导企业做对的事情',
    howToDo: '通过建设核心团队、制定正确战略、打造铁军队伍来实现经营目标',
    category: '经营方法论',
    keywords: ['经营方法论', '建班子', '定战略', '带队伍', '做对的事']
  },
  {
    title: '拉卡拉十二条令 - 指令系统',
    description: '拉卡拉工作行为准则中的指令系统',
    whatIs: '确认指令、及时报告、亲撰周报',
    whyImportant: '规范的指令系统确保信息传递准确高效',
    howToDo: '第一时间确认指令、及时报告进展、亲自撰写周报',
    category: '十二条令',
    keywords: ['十二条令', '确认指令', '及时报告', '亲撰周报', '信息传递']
  },
  {
    title: '拉卡拉十二条令 - 执行系统',
    description: '拉卡拉工作行为准则中的执行系统',
    whatIs: '说到做到、保持准时、解决问题',
    whyImportant: '强化执行力，确保承诺兑现',
    howToDo: '按承诺时间和质量完成任务、准时参与约定事项、主动解决工作障碍',
    category: '十二条令',
    keywords: ['十二条令', '说到做到', '保持准时', '解决问题', '执行力']
  },
  {
    title: '拉卡拉十二条令 - 沟通系统',
    description: '拉卡拉工作行为准则中的沟通系统',
    whatIs: '日清邮件、会议记录、勤写备忘',
    whyImportant: '高效沟通是团队协作的基础',
    howToDo: '24小时内回复邮件、做好会议记录、及时写备忘录',
    category: '十二条令',
    keywords: ['十二条令', '日清邮件', '会议记录', '勤写备忘', '沟通效率']
  },
  {
    title: '拉卡拉十二条令 - 总结系统',
    description: '拉卡拉工作行为准则中的总结系统',
    whatIs: '三条总结、一页报告、统计分析',
    whyImportant: '系统化总结提升工作质量和决策水平',
    howToDo: '用三条说清楚问题、写一页纸报告、用数字说话做分析',
    category: '十二条令',
    keywords: ['十二条令', '三条总结', '一页报告', '统计分析', '数字说话']
  },
  {
    title: '拉卡拉企业文化体系',
    description: '拉卡拉完整的企业文化架构',
    whatIs: '内核（使命愿景价值观）、中核（管理经营方法论）、外核（十二条令工具）',
    whyImportant: '企业文化是队伍战斗力的源泉和倍增器',
    howToDo: '通过内核指导、中核方法、外核工具的三层体系来建设企业文化',
    category: '企业文化体系',
    keywords: ['企业文化', '内核', '中核', '外核', '战斗力', '文化体系']
  }
];

async function insertLakalaCompanyCulture() {
  console.log('🚀 开始插入拉卡拉企业文化数据...\n');

  try {
    // 使用知识库API批量添加拉卡拉企业文化
    const response = await axios.post(`${API_BASE_URL}/api/knowledge/company-values`, {
      companyName: '拉卡拉',
      values: lakalaCompanyCulture
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Frontend-Key': FRONTEND_API_KEY
      }
    });

    console.log('✅ 拉卡拉企业文化数据插入成功!');
    console.log('📊 插入结果:', response.data);

    // 验证插入结果
    console.log('\n🔍 验证插入结果...');
    const statsResponse = await axios.get(`${API_BASE_URL}/api/knowledge/stats`, {
      headers: {
        'X-Frontend-Key': FRONTEND_API_KEY
      }
    });
    
    console.log('📈 当前知识库统计:', statsResponse.data);

    // 搜索拉卡拉相关内容
    console.log('\n🔎 搜索拉卡拉企业文化...');
    const searchResponse = await axios.get(`${API_BASE_URL}/api/knowledge/search`, {
      params: { q: '拉卡拉', limit: 5 },
      headers: {
        'X-Frontend-Key': FRONTEND_API_KEY
      }
    });
    
    console.log('🎯 搜索结果:');
    searchResponse.data.data.forEach((item, index) => {
      console.log(`${index + 1}. ${item.title}`);
    });

  } catch (error) {
    console.error('❌ 插入失败:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 API密钥验证失败，请检查前端API密钥配置');
    }
  }
}

// 执行插入
insertLakalaCompanyCulture(); 