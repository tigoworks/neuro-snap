import { AnalysisResult } from '../types';

export class AnalysisPresenter {
  private result: AnalysisResult;

  constructor(result: AnalysisResult) {
    this.result = result;
  }

  // 格式化分析结果摘要
  formatSummary(): string {
    return this.result.summary || '暂无分析摘要';
  }

  // 格式化完整分析结果
  formatFullAnalysis(): any {
    return {
      model_type: this.result.model_type,
      analysis: this.result.analysis,
      summary: this.formatSummary(),
      created_at: this.result.created_at
    };
  }

  // 格式化错误信息
  static formatError(error: Error): any {
    return {
      error: true,
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }

  // 格式化处理中状态
  static formatProcessing(): any {
    return {
      status: 'processing',
      message: '分析正在进行中',
      timestamp: new Date().toISOString()
    };
  }
} 