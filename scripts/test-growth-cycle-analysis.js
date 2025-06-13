#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function testGrowthCycleAnalysis() {
  console.log('🚀 测试成长周期和未来成就预测功能...\n');

  const testUserId = 'test-growth-cycle-user';
  const frontendKey = 'test-frontend-key-123';
  const baseUrl = 'http://localhost:8080';

  try {
    // 1. 测试提交包含用户年龄信息的答案
    console.log('📝 1. 提交测试答案（包含年龄信息）...');
    
    const testAnswers = {
      userInfo: {
        name: '张三',
        age: 28,
        gender: '男',
        city: '北京',
        occupation: '软件工程师',
        education: '本科'
      },
      fiveQuestions: {
        'fiveq_q1': '1',
        'fiveq_q2': '2',
        'fiveq_q3': '1',
        'fiveq_q4': '2',
        'fiveq_q5': '1'
      },
      mbti: {
        'mbti_ei_q1': '1',
        'mbti_ei_q2': '2',
        'mbti_sn_q1': '1',
        'mbti_sn_q2': '2',
        'mbti_tf_q1': '1',
        'mbti_tf_q2': '2',
        'mbti_jp_q1': '1',
        'mbti_jp_q2': '2'
      },
      bigFive: {
        'bigfive_openness_q1': '4',
        'bigfive_openness_q2': '3',
        'bigfive_conscientiousness_q1': '4',
        'bigfive_conscientiousness_q2': '4',
        'bigfive_extraversion_q1': '3',
        'bigfive_extraversion_q2': '2',
        'bigfive_agreeableness_q1': '4',
        'bigfive_agreeableness_q2': '4',
        'bigfive_neuroticism_q1': '2',
        'bigfive_neuroticism_q2': '3'
      },
      disc: {
        'disc_d_q1': '4',
        'disc_d_q2': '3',
        'disc_i_q1': '3',
        'disc_i_q2': '4',
        'disc_s_q1': '2',
        'disc_s_q2': '3',
        'disc_c_q1': '4',
        'disc_c_q2': '3'
      },
      holland: {
        'holland_realistic_q1': '3',
        'holland_realistic_q2': '2',
        'holland_realistic_q3': '3',
        'holland_investigative_q1': '4',
        'holland_investigative_q2': '4',
        'holland_investigative_q3': '4',
        'holland_artistic_q1': '2',
        'holland_artistic_q2': '3',
        'holland_artistic_q3': '2',
        'holland_social_q1': '3',
        'holland_social_q2': '3',
        'holland_social_q3': '3',
        'holland_enterprising_q1': '3',
        'holland_enterprising_q2': '4',
        'holland_enterprising_q3': '3',
        'holland_conventional_q1': '2',
        'holland_conventional_q2': '2',
        'holland_conventional_q3': '3'
      },
      values: {
        'values_achievement': { order: [1, 2, 3, 4, 5] },
        'values_support': { order: [2, 1, 4, 3, 5] },
        'values_comfort': { order: [3, 4, 1, 2, 5] },
        'values_autonomy': { order: [1, 3, 2, 4, 5] },
        'values_security': { order: [2, 3, 4, 1, 5] },
        'values_prestige': { order: [4, 5, 2, 3, 1] }
      }
    };

    const submitResponse = await fetch(`${baseUrl}/api/submit-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Frontend-Key': frontendKey
      },
      body: JSON.stringify({
        userId: testUserId,
        ...testAnswers
      })
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      throw new Error(`提交答案失败: ${submitResponse.status} ${submitResponse.statusText}\n错误详情: ${errorText}`);
    }

    const submitResult = await submitResponse.json();
    console.log('✅ 答案提交成功:', submitResult.message);
    
    // 获取实际的用户ID（UUID）
    const actualUserId = submitResult.surveyId;
    console.log('📋 获取到用户ID:', actualUserId);

    // 2. 等待AI分析完成
    console.log('\n⏳ 2. 等待AI分析完成...');
    
    let analysisResult = null;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // 等待3秒
      
      const analysisResponse = await fetch(`${baseUrl}/api/analysis-result/user/${actualUserId}`, {
        headers: {
          'X-Frontend-Key': frontendKey
        }
      });

      if (analysisResponse.ok) {
        const result = await analysisResponse.json();
        
        if (result.success && result.data.status === 'completed') {
          analysisResult = result.data.analysis;
          console.log('✅ AI分析完成!');
          break;
        } else if (result.data.status === 'processing') {
          console.log(`⏳ 分析进行中... (${result.data.message})`);
        }
      }
      
      attempts++;
    }

    if (!analysisResult) {
      console.log('⚠️ AI分析超时，检查规则分析结果...');
      
      // 尝试获取规则分析结果
      const analysisResponse = await fetch(`${baseUrl}/api/analysis-result/user/${actualUserId}`, {
        headers: {
          'X-Frontend-Key': frontendKey
        }
      });

      if (analysisResponse.ok) {
        const result = await analysisResponse.json();
        if (result.success && result.data.analysis) {
          analysisResult = result.data.analysis;
          console.log('✅ 获取到规则分析结果');
        }
      }
    }

    if (!analysisResult) {
      console.log('❌ 无法获取分析结果');
      return;
    }

    // 3. 验证分析结果结构
    console.log('\n🔍 3. 验证分析结果结构...');
    console.log('分析结果键:', Object.keys(analysisResult));
    
    const detailedAnalysis = analysisResult.detailedAnalysis || analysisResult.detailed_analysis;
    if (detailedAnalysis) {
      console.log('详细分析键:', Object.keys(detailedAnalysis));
    }

    // 4. 检查是否包含新的分析维度
    console.log('\n📊 4. 检查新增分析维度...');
    
    const hasGrowthCycle = detailedAnalysis && detailedAnalysis.growthCycle;
    const hasFutureAchievements = detailedAnalysis && detailedAnalysis.futureAchievements;
    const hasDevelopmentPathway = detailedAnalysis && detailedAnalysis.developmentPathway;
    
    console.log(`✅ 成长周期分析: ${hasGrowthCycle ? '存在' : '缺失'}`);
    console.log(`✅ 未来成就预测: ${hasFutureAchievements ? '存在' : '缺失'}`);
    console.log(`✅ 发展路径规划: ${hasDevelopmentPathway ? '存在' : '缺失'}`);

    if (hasGrowthCycle) {
      console.log('\n📈 成长周期分析内容:');
      console.log(JSON.stringify(detailedAnalysis.growthCycle, null, 2));
    }

    if (hasFutureAchievements) {
      console.log('\n🎯 未来成就预测内容:');
      console.log(JSON.stringify(detailedAnalysis.futureAchievements, null, 2));
    }

    if (hasDevelopmentPathway) {
      console.log('\n🛤️ 发展路径规划内容:');
      console.log(JSON.stringify(detailedAnalysis.developmentPathway, null, 2));
    }

    // 5. 测试总结
    console.log('\n📋 测试总结:');
    console.log(`成长周期分析: ${hasGrowthCycle ? '✅ 通过' : '❌ 失败'}`);
    console.log(`未来成就预测: ${hasFutureAchievements ? '✅ 通过' : '❌ 失败'}`);
    console.log(`发展路径规划: ${hasDevelopmentPathway ? '✅ 通过' : '❌ 失败'}`);
    
    const allPassed = hasGrowthCycle && hasFutureAchievements && hasDevelopmentPathway;
    console.log(`\n🎉 总体结果: ${allPassed ? '全部通过' : '部分功能需要完善'}`);

    if (!allPassed) {
      console.log('\n💡 建议检查:');
      console.log('1. AI服务是否正常运行');
      console.log('2. 知识库是否包含成长周期相关内容');
      console.log('3. prompt是否正确包含新的分析要求');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 执行测试
testGrowthCycleAnalysis(); 