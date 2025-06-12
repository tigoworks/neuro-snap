"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@jest/globals");
const dotenv_1 = require("dotenv");
// 加载测试环境变量
(0, dotenv_1.config)(); // 加载默认的 .env 文件
// 全局测试设置
beforeAll(async () => {
    // 可以在这里添加测试前的准备工作
    console.log('Setting up test environment...');
});
afterAll(async () => {
    // 可以在这里添加测试后的清理工作
    console.log('Cleaning up test environment...');
});
