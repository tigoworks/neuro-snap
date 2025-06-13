#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { config } = require('dotenv');

// Load environment variables
config();

async function initializeDatabase() {
  console.log('🚀 Initializing database with seed data...\n');

  const { createClient } = require('@supabase/supabase-js');
  
  // Initialize Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration. Please check your .env file.');
    console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    console.log('📊 1. Checking database schema...');
    
    // Check if tables exist by trying to query them
    const { data: existingModels, error: modelError } = await supabase
      .from('survey_model')
      .select('code')
      .limit(1);

    if (modelError) {
      console.error('❌ Database schema not found. Please run the schema migration first.');
      console.error('You can run the SQL from database/migrations/001_initial_schema.sql in your Supabase SQL editor.');
      console.error('Error:', modelError.message);
      return;
    }

    console.log('✅ Database schema exists');

    // 2. Insert survey models
    console.log('\n📝 2. Inserting survey models...');
    
    const surveyModels = [
      {
        id: '615e58c7-0451-4251-b007-5ce76d5e4763',
        code: 'fiveq',
        name: '五问法快速画像',
        description: '5 个开放+选择题，获取主观信息'
      },
      {
        id: '91e7c1c7-3708-4ec0-8152-785d072ac2ed',
        code: 'mbti',
        name: 'MBTI 简化测试',
        description: '4 维度×2 道题'
      },
      {
        id: 'cd9a09b0-b807-418f-9f7a-de4e75a29dad',
        code: 'big5',
        name: '五大人格（Big5）',
        description: '5 维度×2 道题打分'
      },
      {
        id: 'a6a68daa-00ee-4c74-a1af-d18e43d5c95d',
        code: 'disc',
        name: 'DISC 行为风格',
        description: '4 维度×2 道题判断行为倾向'
      },
      {
        id: '0ce1ddde-a5e0-422f-8afb-c09c50f634ac',
        code: 'holland',
        name: '霍兰德职业兴趣（RIASEC）',
        description: '6 维度×2 道题打分'
      },
      {
        id: 'ae60358f-c444-41ac-aa98-52d3927f3116',
        code: 'motivation',
        name: '动机与价值观测试',
        description: '6 道题：多选/排序/文本混合'
      }
    ];

    // Insert models (ignore conflicts)
    for (const model of surveyModels) {
      const { error } = await supabase
        .from('survey_model')
        .upsert(model, { onConflict: 'code' });
      
      if (error) {
        console.warn(`⚠️  Warning inserting model ${model.code}: ${error.message}`);
      } else {
        console.log(`   ✅ Model ${model.code} inserted`);
      }
    }

    // 3. Insert basic survey questions (minimal set for testing)
    console.log('\n📝 3. Inserting basic survey questions...');
    
    const basicQuestions = [
      // Five Questions
      {
        id: '4df5c8f0-1234-4567-8901-000000000001',
        model_id: '615e58c7-0451-4251-b007-5ce76d5e4763',
        question_code: 'fiveq_q1',
        content: '你理想的工作环境是什么样子的？',
        type: 'text',
        sort_order: 1
      },
      {
        id: '4df5c8f0-1234-4567-8901-000000000002',
        model_id: '615e58c7-0451-4251-b007-5ce76d5e4763',
        question_code: 'fiveq_q2',
        content: '你最擅长的技能是什么？',
        type: 'text',
        sort_order: 2
      },
      // MBTI Questions
      {
        id: '4df5c8f0-1234-4567-8901-000000000003',
        model_id: '91e7c1c7-3708-4ec0-8152-785d072ac2ed',
        question_code: 'mbti_ei_q1',
        content: '在聚会中，你更倾向于：',
        options: JSON.stringify([{"code":"1","label":"和几个熟人深聊"},{"code":"2","label":"认识更多新朋友"}]),
        type: 'single',
        sort_order: 1
      },
      {
        id: '4df5c8f0-1234-4567-8901-000000000004',
        model_id: '91e7c1c7-3708-4ec0-8152-785d072ac2ed',
        question_code: 'mbti_sn_q1',
        content: '你做决定时更关注：',
        options: JSON.stringify([{"code":"1","label":"现实细节"},{"code":"2","label":"未来可能性"}]),
        type: 'single',
        sort_order: 2
      },
      // Big Five Questions
      {
        id: '4df5c8f0-1234-4567-8901-000000000005',
        model_id: 'cd9a09b0-b807-418f-9f7a-de4e75a29dad',
        question_code: 'bigfive_openness_q1',
        content: '我喜欢尝试新鲜事物。请打分（1-5）',
        type: 'scale',
        sort_order: 1
      },
      {
        id: '4df5c8f0-1234-4567-8901-000000000006',
        model_id: 'cd9a09b0-b807-418f-9f7a-de4e75a29dad',
        question_code: 'bigfive_conscientiousness_q1',
        content: '我做事很有条理。请打分（1-5）',
        type: 'scale',
        sort_order: 2
      },
      // DISC Questions
      {
        id: '4df5c8f0-1234-4567-8901-000000000007',
        model_id: 'a6a68daa-00ee-4c74-a1af-d18e43d5c95d',
        question_code: 'disc_d_q1',
        content: '面对挑战时，我会直接果断地解决。',
        options: JSON.stringify([{"code":"1","label":"是"},{"code":"2","label":"否"}]),
        type: 'single',
        sort_order: 1
      },
      {
        id: '4df5c8f0-1234-4567-8901-000000000008',
        model_id: 'a6a68daa-00ee-4c74-a1af-d18e43d5c95d',
        question_code: 'disc_i_q1',
        content: '我在团队中经常扮演激励者的角色。',
        options: JSON.stringify([{"code":"1","label":"是"},{"code":"2","label":"否"}]),
        type: 'single',
        sort_order: 2
      },
      // Holland Questions
      {
        id: '4df5c8f0-1234-4567-8901-000000000009',
        model_id: '0ce1ddde-a5e0-422f-8afb-c09c50f634ac',
        question_code: 'holland_realistic_q1',
        content: '我喜欢动手操作机械或工具。请打分（1-5）',
        type: 'scale',
        sort_order: 1
      },
      {
        id: '4df5c8f0-1234-4567-8901-000000000010',
        model_id: '0ce1ddde-a5e0-422f-8afb-c09c50f634ac',
        question_code: 'holland_investigative_q1',
        content: '我对科学研究很感兴趣。请打分（1-5）',
        type: 'scale',
        sort_order: 2
      },
      // Values Questions
      {
        id: '4df5c8f0-1234-4567-8901-000000000011',
        model_id: 'ae60358f-c444-41ac-aa98-52d3927f3116',
        question_code: 'values_achievement',
        content: '成就感对你的重要程度排序',
        type: 'sorting',
        sort_order: 1
      },
      {
        id: '4df5c8f0-1234-4567-8901-000000000012',
        model_id: 'ae60358f-c444-41ac-aa98-52d3927f3116',
        question_code: 'values_support',
        content: '团队支持对你的重要程度排序',
        type: 'sorting',
        sort_order: 2
      }
    ];

    // Insert questions
    for (const question of basicQuestions) {
      const { error } = await supabase
        .from('survey_question')
        .upsert(question, { onConflict: 'question_code' });
      
      if (error) {
        console.warn(`⚠️  Warning inserting question ${question.question_code}: ${error.message}`);
      } else {
        console.log(`   ✅ Question ${question.question_code} inserted`);
      }
    }

    // 4. Insert basic knowledge base entries
    console.log('\n📝 4. Inserting knowledge base entries...');
    
    const knowledgeEntries = [
      {
        title: 'MBTI基础理论',
        content: 'MBTI（Myers-Briggs Type Indicator）是基于荣格心理类型理论的人格评估工具...',
        model_tag: 'mbti'
      },
      {
        title: '五大人格理论',
        content: '五大人格特质模型包括开放性、责任感、外向性、宜人性和神经质...',
        model_tag: 'big5'
      },
      {
        title: 'DISC行为风格',
        content: 'DISC模型将人的行为风格分为支配型、影响型、稳健型和谨慎型...',
        model_tag: 'disc'
      },
      {
        title: '霍兰德职业兴趣理论',
        content: '霍兰德理论将职业兴趣分为现实型、研究型、艺术型、社会型、企业型和常规型...',
        model_tag: 'holland'
      },
      {
        title: '成长周期分析理论',
        content: '个人成长周期包括探索期、建立期、维持期和衰退期，每个阶段都有其特定的发展任务和机遇...',
        model_tag: 'growth_cycle'
      },
      {
        title: '未来成就预测模型',
        content: '基于个人特质、价值观和成长阶段，可以预测个人在不同领域的潜在成就和发展方向...',
        model_tag: 'future_achievements'
      }
    ];

    for (const entry of knowledgeEntries) {
      const { error } = await supabase
        .from('knowledge_base')
        .insert(entry);
      
      if (error) {
        console.warn(`⚠️  Warning inserting knowledge entry "${entry.title}": ${error.message}`);
      } else {
        console.log(`   ✅ Knowledge entry "${entry.title}" inserted`);
      }
    }

    // 5. Verify setup
    console.log('\n🔍 5. Verifying database setup...');
    
    const { data: models, error: modelsError } = await supabase
      .from('survey_model')
      .select('code, name');

    if (modelsError) {
      console.error('❌ Failed to verify survey_model table:', modelsError.message);
    } else {
      console.log(`✅ Found ${models.length} survey models:`);
      models.forEach(model => {
        console.log(`   - ${model.code}: ${model.name}`);
      });
    }

    const { data: questions, error: questionsError } = await supabase
      .from('survey_question')
      .select('question_code', { count: 'exact' });

    if (questionsError) {
      console.error('❌ Failed to verify survey_question table:', questionsError.message);
    } else {
      console.log(`✅ Found ${questions.length} survey questions`);
    }

    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n💡 You can now run the growth cycle analysis test.');

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase }; 