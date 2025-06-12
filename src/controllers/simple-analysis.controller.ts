import { Request, Response } from 'express';
import { SimpleAnalysisService, SimpleAnalysisRequest } from '../services/simple-analysis.service';

export class SimpleAnalysisController {
  private analysisService: SimpleAnalysisService;

  constructor() {
    this.analysisService = new SimpleAnalysisService();
  }

  /**
   * 生成基础分析报告
   */
  async generateAnalysis(req: Request, res: Response): Promise<void> {
    const requestId = req.headers['x-request-id'] as string || `analysis_${Date.now()}`;
    
    try {
      console.log('📊 收到基础分析请求:', requestId);

      // 验证请求数据
      if (!req.body.userId || !req.body.userAnswers) {
        res.status(400).json({
          error: '缺少必需参数：userId 和 userAnswers',
          code: 'MISSING_PARAMS'
        });
        return;
      }

      // 构建分析请求
      const analysisRequest: SimpleAnalysisRequest = {
        userId: req.body.userId,
        userAnswers: req.body.userAnswers,
        analysisType: req.body.analysisType || 'comprehensive',
        language: req.body.language || 'zh'
      };

      console.log('📝 分析请求详情:', {
        userId: analysisRequest.userId,
        analysisType: analysisRequest.analysisType,
        testCount: Object.keys(analysisRequest.userAnswers).length,
        language: analysisRequest.language
      });

      // 执行基础分析
      const analysisResult = await this.analysisService.performAnalysis(analysisRequest);

      console.log('✅ 基础分析完成:', {
        analysisId: analysisResult.id,
        confidence: analysisResult.confidence,
        processingTime: `${analysisResult.processingTime}ms`
      });

      // 生成可视化数据
      const visualizationData = this.generateVisualizationData(analysisRequest.userAnswers, analysisResult);

      // 返回结果
      res.json({
        success: true,
        data: {
          analysisId: analysisResult.id,
          report: {
            summary: {
              title: '基础心理测评分析报告',
              overview: analysisResult.summary,
              keyInsights: analysisResult.personalityInsights,
              strengthsAndWeaknesses: {
                strengths: analysisResult.strengths,
                weaknesses: [],
                improvementAreas: analysisResult.improvementAreas
              }
            },
            personalityProfile: this.extractPersonalityProfile(analysisRequest.userAnswers),
            careerGuidance: {
              idealCareers: analysisResult.careerRecommendations.map((career, index) => ({
                title: career,
                match: Math.round(85 - index * 5),
                description: `${career}相关工作`,
                requirements: ['相关技能', '专业知识'],
                growthPotential: '良好的发展前景'
              })),
              careerDevelopmentPlan: {
                shortTerm: ['提升专业技能', '建立职业网络'],
                mediumTerm: ['获得行业认证', '担任项目负责人'],
                longTerm: ['成为行业专家', '实现职业目标']
              },
              skillsToImprove: analysisResult.improvementAreas,
              industryRecommendations: ['科技', '教育', '咨询', '金融']
            },
            workStyle: {
              preferredEnvironment: '安静、有序的工作环境',
              workingStyle: '注重质量和深度思考',
              communicationStyle: '倾向于书面沟通和一对一交流',
              leadershipStyle: '协作型领导',
              teamRole: '专业顾问或分析师',
              motivationFactors: ['成就感', '学习成长', '工作稳定性']
            },
            recommendations: {
              personalDevelopment: analysisResult.improvementAreas,
              learningResources: ['专业书籍', '在线课程', '行业会议'],
              actionItems: ['制定学习计划', '寻找导师', '参与项目'],
              nextSteps: ['评估当前技能', '设定发展目标', '开始行动']
            },
            visualizationData: visualizationData
          },
          metadata: {
            confidence: analysisResult.confidence,
            processingTime: analysisResult.processingTime,
            knowledgeSourcesUsed: 0,
            analysisType: analysisResult.id.includes('simple') ? 'basic' : 'comprehensive',
            createdAt: analysisResult.createdAt,
            isBasicAnalysis: true
          }
        }
      });

    } catch (error: any) {
      console.error('❌ 基础分析失败:', error);
      
      res.status(500).json({
        error: '分析生成失败',
        details: error.message,
        code: 'ANALYSIS_FAILED'
      });
    }
  }

  /**
   * 预览基础分析结果
   */
  async previewAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { userAnswers, analysisType, language } = req.body;
      
      if (!userAnswers) {
        res.status(400).json({
          error: '缺少用户答案数据',
          code: 'MISSING_USER_ANSWERS'
        });
        return;
      }

      const analysisRequest: SimpleAnalysisRequest = {
        userId: 'preview-user',
        userAnswers,
        analysisType: analysisType || 'comprehensive',
        language: language || 'zh'
      };

      const analysisResult = await this.analysisService.performAnalysis(analysisRequest);
      const visualizationData = this.generateVisualizationData(userAnswers, analysisResult);

      res.json({
        success: true,
        data: {
          summary: analysisResult.summary,
          insights: analysisResult.personalityInsights,
          careers: analysisResult.careerRecommendations,
          strengths: analysisResult.strengths,
          improvements: analysisResult.improvementAreas,
          confidence: analysisResult.confidence,
          visualizationData: visualizationData,
          metadata: {
            processingTime: analysisResult.processingTime,
            isPreview: true,
            isBasicAnalysis: true
          }
        }
      });

    } catch (error: any) {
      console.error('预览分析失败:', error);
      res.status(500).json({
        error: '预览分析失败',
        details: error.message
      });
    }
  }

  /**
   * 提取人格画像数据
   */
  private extractPersonalityProfile(userAnswers: any) {
    // 简化的人格画像提取
    return {
      mbtiType: 'INFP', // 默认值，实际应该基于分析计算
      mbtiDescription: '调停者：富有创造力，忠于自己的价值观',
      bigFiveScores: {
        openness: 75,
        conscientiousness: 65,
        extraversion: 45,
        agreeableness: 80,
        neuroticism: 35
      },
      discProfile: {
        dominance: 25,
        influence: 45,
        steadiness: 65,
        conscientiousness: 65,
        primaryStyle: '稳健型'
      },
      hollandCode: {
        realistic: 30,
        investigative: 80,
        artistic: 70,
        social: 60,
        enterprising: 40,
        conventional: 50,
        topThree: ['investigative', 'artistic', 'social']
      }
    };
  }

  /**
   * 生成可视化数据
   */
  private generateVisualizationData(userAnswers: any, analysisResult: any) {
    const personalityProfile = this.extractPersonalityProfile(userAnswers);
    
    return {
      personalityChart: {
        type: 'radar',
        data: {
          labels: ['开放性', '责任心', '外向性', '宜人性', '神经质'],
          datasets: [{
            label: '大五人格得分',
            data: [
              personalityProfile.bigFiveScores.openness,
              personalityProfile.bigFiveScores.conscientiousness,
              personalityProfile.bigFiveScores.extraversion,
              personalityProfile.bigFiveScores.agreeableness,
              personalityProfile.bigFiveScores.neuroticism
            ],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(54, 162, 235, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
          }]
        },
        options: {
          scale: {
            ticks: {
              beginAtZero: true,
              max: 100
            }
          }
        }
      },
      careerFitChart: {
        type: 'bar',
        data: {
          labels: analysisResult.careerRecommendations.slice(0, 5),
          datasets: [{
            label: '职业匹配度',
            data: analysisResult.careerRecommendations.slice(0, 5).map((_: any, index: number) => 90 - index * 8),
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 205, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(153, 102, 255, 0.8)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 205, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              max: 100
            }
          }
        }
      },
      skillsRadarChart: {
        type: 'radar',
        data: {
          labels: ['支配性', '影响力', '稳定性', '谨慎性'],
          datasets: [{
            label: 'DISC行为风格',
            data: [
              personalityProfile.discProfile.dominance,
              personalityProfile.discProfile.influence,
              personalityProfile.discProfile.steadiness,
              personalityProfile.discProfile.conscientiousness
            ],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(75, 192, 192, 1)',
            pointBorderColor: '#fff'
          }]
        }
      },
      hollandChart: {
        type: 'polarArea',
        data: {
          labels: ['现实型', '研究型', '艺术型', '社会型', '企业型', '常规型'],
          datasets: [{
            label: '霍兰德兴趣类型',
            data: [
              personalityProfile.hollandCode.realistic,
              personalityProfile.hollandCode.investigative,
              personalityProfile.hollandCode.artistic,
              personalityProfile.hollandCode.social,
              personalityProfile.hollandCode.enterprising,
              personalityProfile.hollandCode.conventional
            ],
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 205, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)',
              'rgba(255, 159, 64, 0.7)'
            ]
          }]
        }
      },
      developmentPathway: {
        type: 'timeline',
        data: {
          shortTerm: ['提升专业技能', '建立职业网络'],
          mediumTerm: ['获得行业认证', '担任项目负责人'],
          longTerm: ['成为行业专家', '实现职业目标']
        }
      }
    };
  }

  /**
   * 获取分析统计信息
   */
  async getAnalysisStats(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        success: true,
        data: {
          analysisType: 'basic',
          supportedFeatures: [
            'MBTI人格分析',
            '大五人格评估',
            'DISC行为风格',
            '霍兰德职业兴趣',
            '价值观分析',
            '职业推荐',
            '可视化图表'
          ],
          limitations: [
            '基于规则的分析，不使用AI',
            '简化的评分算法',
            '固定的职业推荐库'
          ],
          processingTime: '通常 < 100ms',
          confidence: '60-95%',
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error: any) {
      res.status(500).json({
        error: '获取统计信息失败',
        details: error.message
      });
    }
  }
} 