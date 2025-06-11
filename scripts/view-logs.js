#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 日志文件路径
const LOG_DIR = path.join(__dirname, '../logs');
const COMBINED_LOG = path.join(LOG_DIR, 'combined.log');
const ERROR_LOG = path.join(LOG_DIR, 'error.log');

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

// 日志类型对应的颜色
const logColors = {
  error: colors.red,
  warn: colors.yellow,
  info: colors.blue,
  debug: colors.gray,
  '🚀': colors.green,
  '✅': colors.green,
  '❌': colors.red,
  '🗄️': colors.cyan,
  '📊': colors.magenta,
  '💾': colors.yellow
};

function colorize(text, color) {
  return color + text + colors.reset;
}

function formatLogEntry(logEntry) {
  try {
    const parsed = JSON.parse(logEntry);
    const timestamp = new Date(parsed.timestamp).toLocaleString();
    const level = parsed.level || 'info';
    const message = parsed.message || '';
    
    // 获取颜色
    let color = logColors[level] || colors.white;
    for (const [emoji, emojiColor] of Object.entries(logColors)) {
      if (message.includes(emoji)) {
        color = emojiColor;
        break;
      }
    }

    // 格式化基本信息
    let formatted = colorize(`[${timestamp}] ${level.toUpperCase()}`, color) + ` ${message}`;

    // 添加额外信息
    if (parsed.requestId) {
      formatted += colorize(` (req: ${parsed.requestId})`, colors.gray);
    }
    
    if (parsed.queryId) {
      formatted += colorize(` (query: ${parsed.queryId})`, colors.gray);
    }

    if (parsed.duration) {
      formatted += colorize(` [${parsed.duration}]`, colors.yellow);
    }

    if (parsed.method && parsed.url) {
      formatted += colorize(` ${parsed.method} ${parsed.url}`, colors.cyan);
    }

    if (parsed.table) {
      formatted += colorize(` table: ${parsed.table}`, colors.magenta);
    }

    if (parsed.statusCode) {
      const statusColor = parsed.statusCode >= 400 ? colors.red : colors.green;
      formatted += colorize(` ${parsed.statusCode}`, statusColor);
    }

    // 详细信息（可选显示）
    if (process.argv.includes('--details')) {
      const details = [];
      
      if (parsed.clientInfo) {
        details.push(`IP: ${parsed.clientInfo.ip}`);
      }
      
      if (parsed.resultCount !== undefined) {
        details.push(`Results: ${parsed.resultCount}`);
      }
      
      if (parsed.responseSize) {
        details.push(`Size: ${parsed.responseSize}B`);
      }

      if (details.length > 0) {
        formatted += colorize(`\n    ${details.join(', ')}`, colors.gray);
      }
    }

    return formatted;
  } catch (error) {
    return colorize(logEntry, colors.gray);
  }
}

function readLogFile(filePath, options = {}) {
  if (!fs.existsSync(filePath)) {
    console.log(colorize(`Log file not found: ${filePath}`, colors.red));
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n').filter(line => line.trim());

  let filteredLines = lines;

  // 按类型过滤
  if (options.type) {
    filteredLines = filteredLines.filter(line => {
      try {
        const parsed = JSON.parse(line);
        return parsed.level === options.type || parsed.message.includes(options.type);
      } catch {
        return false;
      }
    });
  }

  // 按时间过滤（最近N行）
  if (options.tail) {
    filteredLines = filteredLines.slice(-options.tail);
  }

  // 按关键词过滤
  if (options.grep) {
    filteredLines = filteredLines.filter(line => 
      line.toLowerCase().includes(options.grep.toLowerCase())
    );
  }

  return filteredLines;
}

function showUsage() {
  console.log(`
${colorize('日志查看工具', colors.green)}

用法:
  node scripts/view-logs.js [选项]

选项:
  --tail <n>     显示最后 n 行日志 (默认: 50)
  --type <type>  按类型过滤 (error, info, warn, debug)
  --grep <text>  按关键词过滤
  --details      显示详细信息
  --error        只显示错误日志
  --db           只显示数据库相关日志
  --api          只显示API请求日志
  --help         显示帮助信息

示例:
  node scripts/view-logs.js --tail 20
  node scripts/view-logs.js --type error
  node scripts/view-logs.js --grep "Database Query"
  node scripts/view-logs.js --api --details
  node scripts/view-logs.js --db --tail 10
  `);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    showUsage();
    return;
  }

  const options = {
    tail: 50,
    type: null,
    grep: null,
    details: args.includes('--details')
  };

  // 解析参数
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--tail':
        options.tail = parseInt(args[i + 1]) || 50;
        i++;
        break;
      case '--type':
        options.type = args[i + 1];
        i++;
        break;
      case '--grep':
        options.grep = args[i + 1];
        i++;
        break;
      case '--error':
        options.type = 'error';
        break;
      case '--db':
        options.grep = 'Database Query';
        break;
      case '--api':
        options.grep = 'API Request';
        break;
    }
  }

  console.log(colorize('\n=== Neuro-Snap API 日志查看器 ===', colors.green));
  console.log(colorize(`查看时间: ${new Date().toLocaleString()}`, colors.gray));
  
  if (options.type) {
    console.log(colorize(`过滤类型: ${options.type}`, colors.yellow));
  }
  
  if (options.grep) {
    console.log(colorize(`关键词: ${options.grep}`, colors.yellow));
  }
  
  console.log(colorize(`显示行数: ${options.tail}`, colors.yellow));
  console.log('');

  // 读取日志
  const logFile = options.type === 'error' ? ERROR_LOG : COMBINED_LOG;
  const lines = readLogFile(logFile, options);

  if (!lines || lines.length === 0) {
    console.log(colorize('没有找到匹配的日志条目', colors.yellow));
    return;
  }

  // 显示日志
  lines.forEach(line => {
    console.log(formatLogEntry(line));
  });

  console.log(colorize(`\n显示了 ${lines.length} 条日志`, colors.green));
}

main(); 