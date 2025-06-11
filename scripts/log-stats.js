#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 日志文件路径
const LOG_DIR = path.join(__dirname, '../logs');
const COMBINED_LOG = path.join(LOG_DIR, 'combined.log');

// 颜色代码
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

function colorize(text, color) {
  return color + text + colors.reset;
}

function analyzeLogFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(colorize(`Log file not found: ${filePath}`, colors.red));
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n').filter(line => line.trim());

  const stats = {
    total: 0,
    requests: {
      total: 0,
      success: 0,
      error: 0,
      byMethod: {},
      byEndpoint: {},
      responseTimeTotal: 0,
      responseTimeCount: 0,
      avgResponseTime: 0
    },
    database: {
      total: 0,
      success: 0,
      error: 0,
      byTable: {},
      byOperation: {},
      queryTimeTotal: 0,
      queryTimeCount: 0,
      avgQueryTime: 0
    },
    errors: [],
    timeRange: {
      start: null,
      end: null
    }
  };

  lines.forEach(line => {
    try {
      const log = JSON.parse(line);
      stats.total++;

      // 时间范围
      const timestamp = new Date(log.timestamp);
      if (!stats.timeRange.start || timestamp < stats.timeRange.start) {
        stats.timeRange.start = timestamp;
      }
      if (!stats.timeRange.end || timestamp > stats.timeRange.end) {
        stats.timeRange.end = timestamp;
      }

      // API请求统计
      if (log.message && log.message.includes('API Request')) {
        if (log.message.includes('Started')) {
          stats.requests.total++;
          
          if (log.method) {
            stats.requests.byMethod[log.method] = (stats.requests.byMethod[log.method] || 0) + 1;
          }
          
          if (log.path) {
            const endpoint = log.path.split('?')[0]; // 移除查询参数
            stats.requests.byEndpoint[endpoint] = (stats.requests.byEndpoint[endpoint] || 0) + 1;
          }
        } else if (log.message.includes('Completed')) {
          if (log.statusCode >= 200 && log.statusCode < 400) {
            stats.requests.success++;
          } else {
            stats.requests.error++;
          }

          // 响应时间统计
          if (log.duration) {
            const duration = parseFloat(log.duration.replace('ms', ''));
            if (!isNaN(duration)) {
              stats.requests.responseTimeTotal += duration;
              stats.requests.responseTimeCount++;
            }
          }
        }
      }

      // 数据库查询统计
      if (log.message && log.message.includes('Database Query')) {
        if (log.message.includes('Started')) {
          stats.database.total++;
          
          if (log.table) {
            stats.database.byTable[log.table] = (stats.database.byTable[log.table] || 0) + 1;
          }
          
          if (log.operation) {
            stats.database.byOperation[log.operation] = (stats.database.byOperation[log.operation] || 0) + 1;
          }
        } else if (log.message.includes('Success')) {
          stats.database.success++;
          
          // 查询时间统计
          if (log.duration) {
            const duration = parseFloat(log.duration.replace('ms', ''));
            if (!isNaN(duration)) {
              stats.database.queryTimeTotal += duration;
              stats.database.queryTimeCount++;
            }
          }
        } else if (log.message.includes('Failed')) {
          stats.database.error++;
        }
      }

      // 错误收集
      if (log.level === 'error') {
        stats.errors.push({
          timestamp: log.timestamp,
          message: log.message,
          error: log.error
        });
      }

    } catch (error) {
      // 忽略解析错误的行
    }
  });

  // 计算平均值
  if (stats.requests.responseTimeCount > 0) {
    stats.requests.avgResponseTime = (stats.requests.responseTimeTotal / stats.requests.responseTimeCount).toFixed(2);
  }

  if (stats.database.queryTimeCount > 0) {
    stats.database.avgQueryTime = (stats.database.queryTimeTotal / stats.database.queryTimeCount).toFixed(2);
  }

  return stats;
}

function displayStats(stats) {
  console.log(colorize('\n📊 === Neuro-Snap API 日志统计报告 ===', colors.green));
  
  // 时间范围
  if (stats.timeRange.start && stats.timeRange.end) {
    console.log(colorize(`⏰ 统计时间: ${stats.timeRange.start.toLocaleString()} - ${stats.timeRange.end.toLocaleString()}`, colors.gray));
  }
  
  console.log(colorize(`📝 总日志条数: ${stats.total}`, colors.blue));

  // API请求统计
  console.log(colorize('\n🚀 === API 请求统计 ===', colors.cyan));
  console.log(`总请求数: ${stats.requests.total}`);
  console.log(`成功: ${colorize(stats.requests.success, colors.green)} | 失败: ${colorize(stats.requests.error, colors.red)}`);
  
  if (stats.requests.total > 0) {
    const successRate = ((stats.requests.success / (stats.requests.success + stats.requests.error)) * 100).toFixed(1);
    const successColor = successRate >= 95 ? colors.green : successRate >= 90 ? colors.yellow : colors.red;
    console.log(`成功率: ${colorize(successRate + '%', successColor)}`);
  }
  
  if (stats.requests.avgResponseTime > 0) {
    const responseColor = stats.requests.avgResponseTime < 100 ? colors.green : 
                         stats.requests.avgResponseTime < 500 ? colors.yellow : colors.red;
    console.log(`平均响应时间: ${colorize(stats.requests.avgResponseTime + 'ms', responseColor)}`);
  }

  // 按方法统计
  if (Object.keys(stats.requests.byMethod).length > 0) {
    console.log(colorize('\n📋 按HTTP方法统计:', colors.yellow));
    Object.entries(stats.requests.byMethod)
      .sort(([,a], [,b]) => b - a)
      .forEach(([method, count]) => {
        console.log(`  ${method}: ${count}`);
      });
  }

  // 按端点统计
  if (Object.keys(stats.requests.byEndpoint).length > 0) {
    console.log(colorize('\n🎯 热门API端点:', colors.yellow));
    Object.entries(stats.requests.byEndpoint)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([endpoint, count]) => {
        console.log(`  ${endpoint}: ${count}`);
      });
  }

  // 数据库查询统计
  console.log(colorize('\n🗄️ === 数据库查询统计 ===', colors.cyan));
  console.log(`总查询数: ${stats.database.total}`);
  console.log(`成功: ${colorize(stats.database.success, colors.green)} | 失败: ${colorize(stats.database.error, colors.red)}`);
  
  if (stats.database.total > 0) {
    const successRate = ((stats.database.success / (stats.database.success + stats.database.error)) * 100).toFixed(1);
    const successColor = successRate >= 95 ? colors.green : successRate >= 90 ? colors.yellow : colors.red;
    console.log(`成功率: ${colorize(successRate + '%', successColor)}`);
  }
  
  if (stats.database.avgQueryTime > 0) {
    const queryColor = stats.database.avgQueryTime < 50 ? colors.green : 
                      stats.database.avgQueryTime < 200 ? colors.yellow : colors.red;
    console.log(`平均查询时间: ${colorize(stats.database.avgQueryTime + 'ms', queryColor)}`);
  }

  // 按表统计
  if (Object.keys(stats.database.byTable).length > 0) {
    console.log(colorize('\n📊 按数据表统计:', colors.yellow));
    Object.entries(stats.database.byTable)
      .sort(([,a], [,b]) => b - a)
      .forEach(([table, count]) => {
        console.log(`  ${table}: ${count}`);
      });
  }

  // 按操作统计
  if (Object.keys(stats.database.byOperation).length > 0) {
    console.log(colorize('\n⚡ 按操作类型统计:', colors.yellow));
    Object.entries(stats.database.byOperation)
      .sort(([,a], [,b]) => b - a)
      .forEach(([operation, count]) => {
        console.log(`  ${operation}: ${count}`);
      });
  }

  // 错误统计
  if (stats.errors.length > 0) {
    console.log(colorize('\n❌ === 错误统计 ===', colors.red));
    console.log(`错误总数: ${stats.errors.length}`);
    
    // 显示最近的错误
    console.log(colorize('\n🔥 最近的错误:', colors.red));
    stats.errors.slice(-5).forEach((error, index) => {
      console.log(`  ${index + 1}. [${new Date(error.timestamp).toLocaleString()}] ${error.message}`);
      if (error.error && error.error.message) {
        console.log(`     ${colorize(error.error.message, colors.gray)}`);
      }
    });
  }

  // 性能建议
  console.log(colorize('\n💡 === 性能建议 ===', colors.magenta));
  
  if (stats.requests.avgResponseTime > 1000) {
    console.log(colorize('⚠️  API响应时间较慢，建议优化业务逻辑或数据库查询', colors.yellow));
  }
  
  if (stats.database.avgQueryTime > 200) {
    console.log(colorize('⚠️  数据库查询较慢，建议添加索引或优化查询语句', colors.yellow));
  }
  
  if (stats.requests.error > stats.requests.success * 0.1) {
    console.log(colorize('⚠️  错误率较高，建议检查错误日志并修复问题', colors.yellow));
  }
  
  if (stats.database.error > 0) {
    console.log(colorize('⚠️  存在数据库查询错误，建议检查连接和SQL语句', colors.yellow));
  }

  console.log(colorize('\n✅ 统计完成', colors.green));
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
${colorize('日志统计工具', colors.green)}

用法:
  node scripts/log-stats.js

功能:
  - API请求统计 (总数、成功率、响应时间)
  - 数据库查询统计 (总数、成功率、查询时间)
  - 错误统计和分析
  - 性能建议

示例:
  node scripts/log-stats.js
    `);
    return;
  }

  const stats = analyzeLogFile(COMBINED_LOG);
  
  if (stats) {
    displayStats(stats);
  }
}

main(); 