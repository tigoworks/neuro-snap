const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');
require('dotenv').config(); // 加载 .env 文件

console.log('🚀 OpenAI V2Ray SOCKS5 代理连接测试\n');

const apiKey = process.env.OPENAI_API_KEY;

// V2Ray 常见的 SOCKS5 代理端口配置
const proxyConfigs = [
  'socks5h://127.0.0.1:1080',  // 默认 V2Ray SOCKS5 端口
  'socks5h://127.0.0.1:1081',  // 备用端口
  'socks5h://127.0.0.1:7890',  // Clash 默认端口
  'socks5h://127.0.0.1:10808', // 另一个常见端口
];

async function testWithSocksProxy(proxyUrl) {
  console.log(`🔧 测试代理: ${proxyUrl}`);
  
  try {
    const agent = new SocksProxyAgent(proxyUrl);
    
    console.log('📡 发送请求到 OpenAI API...');
    const startTime = Date.now();
    
    const response = await axios.get('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'neuro-snap-v2ray-test/1.0'
      },
      httpsAgent: agent,
      timeout: 15000,
    });
    
    const duration = Date.now() - startTime;
    
    console.log('✅ 连接成功！');
    console.log(`⏱️  响应时间: ${duration}ms`);
    console.log(`📊 可用模型数量: ${response.data.data?.length || 0}`);
    
    // 检查是否有 GPT-4 模型
    if (response.data.data) {
      const gpt4Models = response.data.data.filter(model => 
        model.id.includes('gpt-4') || model.id.includes('gpt-4o')
      );
      console.log(`🤖 GPT-4 系列模型: ${gpt4Models.length} 个`);
      
      if (gpt4Models.length > 0) {
        console.log('🎯 可用的 GPT-4 模型:');
        gpt4Models.slice(0, 5).forEach(model => {
          console.log(`   - ${model.id}`);
        });
      }
    }
    
    return { success: true, proxy: proxyUrl, duration };
    
  } catch (error) {
    console.log('❌ 连接失败:', error.message);
    
    if (error.code) {
      console.log('🔍 错误代码:', error.code);
    }
    
    if (error.response) {
      console.log('📊 HTTP 状态码:', error.response.status);
      console.log('📄 错误详情:', error.response.data);
    }
    
    return { success: false, proxy: proxyUrl, error: error.message };
  }
}

async function testDirectConnection() {
  console.log('🔧 测试直接连接（无代理）');
  
  try {
    const response = await axios.get('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'neuro-snap-direct-test/1.0'
      },
      timeout: 10000,
    });
    
    console.log('✅ 直接连接成功！');
    console.log(`📊 可用模型数量: ${response.data.data?.length || 0}`);
    return { success: true, proxy: 'direct' };
    
  } catch (error) {
    console.log('❌ 直接连接失败:', error.message);
    return { success: false, proxy: 'direct', error: error.message };
  }
}

async function updateEnvironmentConfig(workingProxy) {
  console.log('\n🔧 更新环境配置');
  console.log('=====================================');
  
  if (workingProxy && workingProxy !== 'direct') {
    console.log(`✅ 找到可用代理: ${workingProxy}`);
    console.log('\n📝 建议的环境变量配置:');
    console.log(`OPENAI_PROXY=${workingProxy}`);
    console.log('\n💡 您可以将此配置添加到 .env 文件中');
    
    // 可选：自动更新 .env 文件
    const fs = require('fs');
    try {
      let envContent = fs.readFileSync('.env', 'utf8');
      
      // 检查是否已存在 OPENAI_PROXY 配置
      if (envContent.includes('OPENAI_PROXY=')) {
        envContent = envContent.replace(/OPENAI_PROXY=.*$/m, `OPENAI_PROXY=${workingProxy}`);
      } else {
        envContent += `\nOPENAI_PROXY=${workingProxy}\n`;
      }
      
      fs.writeFileSync('.env', envContent);
      console.log('✅ 已自动更新 .env 文件');
      
    } catch (error) {
      console.log('⚠️  无法自动更新 .env 文件:', error.message);
    }
  }
}

async function runV2RayTest() {
  console.log('🔍 开始 V2Ray SOCKS5 代理测试\n');
  
  if (!apiKey) {
    console.log('❌ 未找到 OPENAI_API_KEY，请检查 .env 文件');
    return;
  }
  
  console.log('🔑 API Key 检查: ✅');
  console.log(`🔑 API Key 长度: ${apiKey.length} 字符`);
  console.log(`🔑 API Key 前缀: ${apiKey.substring(0, 20)}...\n`);
  
  const results = [];
  
  // 测试直接连接
  console.log('📋 测试 1: 直接连接');
  console.log('=====================================');
  const directResult = await testDirectConnection();
  results.push(directResult);
  
  // 测试各种 SOCKS5 代理配置
  for (let i = 0; i < proxyConfigs.length; i++) {
    console.log(`\n📋 测试 ${i + 2}: SOCKS5 代理`);
    console.log('=====================================');
    const result = await testWithSocksProxy(proxyConfigs[i]);
    results.push(result);
    
    // 如果找到可用的代理，可以选择停止测试其他代理
    if (result.success) {
      console.log('\n🎉 找到可用的代理配置！');
      break;
    }
  }
  
  // 总结结果
  console.log('\n📊 测试结果总结');
  console.log('=====================================');
  
  const successfulConnections = results.filter(r => r.success);
  
  if (successfulConnections.length > 0) {
    console.log('✅ 成功的连接:');
    successfulConnections.forEach(result => {
      const proxyText = result.proxy === 'direct' ? '直接连接' : result.proxy;
      const durationText = result.duration ? ` (${result.duration}ms)` : '';
      console.log(`   - ${proxyText}${durationText}`);
    });
    
    // 推荐最快的连接
    const fastest = successfulConnections.reduce((prev, current) => {
      return (current.duration || Infinity) < (prev.duration || Infinity) ? current : prev;
    });
    
    console.log(`\n🚀 推荐使用: ${fastest.proxy === 'direct' ? '直接连接' : fastest.proxy}`);
    
    // 更新环境配置
    await updateEnvironmentConfig(fastest.proxy);
    
  } else {
    console.log('❌ 所有连接都失败了');
    console.log('\n💡 建议检查:');
    console.log('1. V2Ray 是否正在运行');
    console.log('2. SOCKS5 代理端口是否正确');
    console.log('3. V2Ray 配置是否允许本地连接');
    console.log('4. 防火墙设置');
  }
  
  console.log('\n🔧 V2Ray 配置提示:');
  console.log('- 确保 V2Ray 的 SOCKS5 入站配置已启用');
  console.log('- 检查端口号是否与测试的端口匹配');
  console.log('- 确认 "allowTransparent": true 设置');
}

// 运行测试
runV2RayTest().catch(console.error); 