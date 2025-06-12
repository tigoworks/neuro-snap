const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 从环境变量获取Supabase配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 请设置 SUPABASE_URL 和 SUPABASE_ANON_KEY 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupKnowledgeBase() {
  try {
    console.log('🚀 开始设置知识库...');

    // 读取SQL文件
    const sqlFilePath = path.join(__dirname, '../database/seeds/002_taiguo_company_values.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ SQL文件不存在:', sqlFilePath);
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('📄 已读取SQL文件');

    // 分割SQL语句（简单的分割，基于分号）
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 找到 ${statements.length} 个SQL语句`);

    // 执行每个SQL语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.toLowerCase().includes('create table') || 
          statement.toLowerCase().includes('create index') ||
          statement.toLowerCase().includes('do $$')) {
        console.log(`⚙️  执行结构语句 ${i + 1}/${statements.length}`);
        
        try {
          // 对于结构性语句，我们使用rpc调用
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
          if (error) {
            console.warn(`⚠️  结构语句执行警告: ${error.message}`);
          }
        } catch (err) {
          console.warn(`⚠️  结构语句跳过: ${err.message}`);
        }
      } else if (statement.toLowerCase().includes('insert into')) {
        console.log(`📥 执行插入语句 ${i + 1}/${statements.length}`);
        
        try {
          // 对于插入语句，我们解析并使用Supabase客户端
          await executeInsertStatement(statement);
        } catch (err) {
          console.error(`❌ 插入语句执行失败: ${err.message}`);
        }
      } else if (statement.toLowerCase().includes('select')) {
        console.log(`🔍 执行查询语句 ${i + 1}/${statements.length}`);
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });
          if (error) {
            console.warn(`⚠️  查询执行警告: ${error.message}`);
          } else {
            console.log('📊 查询结果:', data);
          }
        } catch (err) {
          console.warn(`⚠️  查询跳过: ${err.message}`);
        }
      }
    }

    // 验证数据是否插入成功
    console.log('🔍 验证数据插入...');
    const { data: knowledgeData, error: knowledgeError } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('model_tag', 'company_values');

    if (knowledgeError) {
      console.error('❌ 验证失败:', knowledgeError.message);
    } else {
      console.log(`✅ 成功插入 ${knowledgeData.length} 条钛果价值观数据`);
      knowledgeData.forEach((item, index) => {
        const content = JSON.parse(item.content);
        console.log(`   ${index + 1}. ${content.title}`);
      });
    }

    console.log('🎉 知识库设置完成！');

  } catch (error) {
    console.error('❌ 设置知识库失败:', error.message);
    process.exit(1);
  }
}

async function executeInsertStatement(statement) {
  // 简单的INSERT语句解析和执行
  // 这里我们直接使用预定义的数据来插入
  const companyValues = [
    {
      title: '钛果 - 客户情绪为先',
      content: JSON.stringify({
        title: '客户情绪为先',
        description: '营造一个良好的合作关系，追求初期良好的合作意愿度',
        whatIs: '良好的客户情绪是建立合作意愿度的开端',
        whyImportant: '真心实意把客户当朋友',
        howToDo: '始终以客户情绪为优先考虑',
        category: '客户关系',
        keywords: ['客户情绪', '合作关系', '合作意愿', '客户优先']
      }),
      model_tag: 'company_values',
      source_type: 'company_values'
    },
    {
      title: '钛果 - 合作共赢为本',
      content: JSON.stringify({
        title: '合作共赢为本',
        description: '建立长期稳定的合作关系，实现多方共赢',
        whatIs: '以合作共赢为核心理念的商业模式',
        whyImportant: '只有共赢才能建立长久的合作关系',
        howToDo: '在每个合作中寻找多方利益平衡点',
        category: '合作理念',
        keywords: ['合作共赢', '长期合作', '多方共赢', '利益平衡']
      }),
      model_tag: 'company_values',
      source_type: 'company_values'
    },
    {
      title: '钛果 - 真实诚信',
      content: JSON.stringify({
        title: '真实诚信',
        description: '以诚待人，言行一致，建立可信赖的品牌形象',
        whatIs: '诚实守信是企业立身之本',
        whyImportant: '诚信是建立信任关系的基础',
        howToDo: '在所有商业活动中保持透明和诚实',
        category: '品德修养',
        keywords: ['真实诚信', '言行一致', '可信赖', '透明诚实']
      }),
      model_tag: 'company_values',
      source_type: 'company_values'
    },
    {
      title: '钛果 - 刨根问底',
      content: JSON.stringify({
        title: '刨根问底',
        description: '深入思考问题本质，不满足于表面现象',
        whatIs: '追求问题根本原因的思维方式',
        whyImportant: '只有找到根本原因才能彻底解决问题',
        howToDo: '对每个问题都要问为什么，直到找到根本原因',
        category: '思维方式',
        keywords: ['刨根问底', '深入思考', '问题本质', '根本原因']
      }),
      model_tag: 'company_values',
      source_type: 'company_values'
    },
    {
      title: '钛果 - 结果导向',
      content: JSON.stringify({
        title: '结果导向',
        description: '以最终结果为目标，注重执行效果',
        whatIs: '以达成目标结果为工作导向',
        whyImportant: '结果是检验工作成效的唯一标准',
        howToDo: '制定明确目标，专注执行，确保达成结果',
        category: '工作方式',
        keywords: ['结果导向', '目标达成', '执行效果', '工作成效']
      }),
      model_tag: 'company_values',
      source_type: 'company_values'
    },
    {
      title: '钛果 - 自驱自省',
      content: JSON.stringify({
        title: '自驱自省',
        description: '主动承担责任，持续自我反思和改进',
        whatIs: '自我驱动和自我反省的能力',
        whyImportant: '自驱自省是个人成长的内在动力',
        howToDo: '主动设定目标，定期反思总结，持续改进',
        category: '个人成长',
        keywords: ['自驱自省', '主动承担', '自我反思', '持续改进']
      }),
      model_tag: 'company_values',
      source_type: 'company_values'
    },
    {
      title: '钛果 - 乐观勇敢',
      content: JSON.stringify({
        title: '乐观勇敢',
        description: '保持积极心态，勇于面对挑战',
        whatIs: '积极乐观的心态和勇于挑战的精神',
        whyImportant: '乐观勇敢是克服困难的精神力量',
        howToDo: '面对困难时保持乐观，勇于尝试新的解决方案',
        category: '心态品质',
        keywords: ['乐观勇敢', '积极心态', '勇于挑战', '克服困难']
      }),
      model_tag: 'company_values',
      source_type: 'company_values'
    },
    {
      title: '钛果 - 追求极致',
      content: JSON.stringify({
        title: '追求极致',
        description: '不断追求完美，力求做到最好',
        whatIs: '对品质和效果的极致追求',
        whyImportant: '极致的追求才能创造卓越的成果',
        howToDo: '在每个细节上都力求完美，不断优化改进',
        category: '品质追求',
        keywords: ['追求极致', '追求完美', '卓越成果', '细节完美']
      }),
      model_tag: 'company_values',
      source_type: 'company_values'
    },
    {
      title: '钛果 - 相信相信',
      content: JSON.stringify({
        title: '相信相信',
        description: '相信团队，相信未来，相信可能性',
        whatIs: '对团队和未来的坚定信念',
        whyImportant: '相信是一切成功的前提',
        howToDo: '给予团队充分信任，对未来保持信心',
        category: '信念力量',
        keywords: ['相信相信', '团队信任', '坚定信念', '成功前提']
      }),
      model_tag: 'company_values',
      source_type: 'company_values'
    },
    {
      title: '钛果 - 以终为始',
      content: JSON.stringify({
        title: '以终为始',
        description: '从目标出发，倒推执行路径',
        whatIs: '以最终目标为起点的思维方式',
        whyImportant: '明确终点才能找到最佳路径',
        howToDo: '先确定最终目标，再制定实现路径',
        category: '目标管理',
        keywords: ['以终为始', '目标导向', '倒推路径', '最佳路径']
      }),
      model_tag: 'company_values',
      source_type: 'company_values'
    },
    {
      title: '钛果 - 同心同德',
      content: JSON.stringify({
        title: '同心同德',
        description: '团队协作，目标一致，共同努力',
        whatIs: '团队成员心往一处想，劲往一处使',
        whyImportant: '团结一致是团队成功的关键',
        howToDo: '建立共同目标，加强沟通协作',
        category: '团队协作',
        keywords: ['同心同德', '团队协作', '目标一致', '团结一致']
      }),
      model_tag: 'company_values',
      source_type: 'company_values'
    },
    {
      title: '钛果 - 正向影响',
      content: JSON.stringify({
        title: '正向影响',
        description: '传播正能量，产生积极影响',
        whatIs: '通过自身行为产生正面影响力',
        whyImportant: '正向影响能够创造更好的环境',
        howToDo: '以身作则，传播正能量，影响他人',
        category: '影响力',
        keywords: ['正向影响', '正能量', '积极影响', '以身作则']
      }),
      model_tag: 'company_values',
      source_type: 'company_values'
    },
    {
      title: '钛果 - 防区延伸',
      content: JSON.stringify({
        title: '防区延伸',
        description: '主动扩大责任范围，承担更多职责',
        whatIs: '主动承担超出职责范围的工作',
        whyImportant: '防区延伸体现主人翁精神',
        howToDo: '主动关注相关领域，承担额外责任',
        category: '责任担当',
        keywords: ['防区延伸', '责任范围', '主人翁精神', '额外责任']
      }),
      model_tag: 'company_values',
      source_type: 'company_values'
    }
  ];

  // 批量插入数据
  const { data, error } = await supabase
    .from('knowledge_base')
    .insert(companyValues)
    .select();

  if (error) {
    throw error;
  }

  console.log(`✅ 成功插入 ${data.length} 条钛果价值观数据`);
  return data;
}

// 运行脚本
if (require.main === module) {
  setupKnowledgeBase().catch(console.error);
}

module.exports = { setupKnowledgeBase }; 