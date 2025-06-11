import { Request, Response } from 'express';
import { ServiceFactory } from '../services/factory';

export class UserController {
  // 保存用户信息
  async saveUserInfo(req: Request, res: Response) {
    try {
      const userInfo = req.body;

      // 转换性别格式
      const gender = userInfo.gender === '男' ? 'male' : userInfo.gender === '女' ? 'female' : 'unknown';

      // 转换年龄为数字
      const age = parseInt(userInfo.age, 10);

      // 获取知识库服务（用于访问 Supabase）
      const knowledgeBase = ServiceFactory.createKnowledgeBase({
        type: 'supabase',
      });

      // 构建用户信息条目
      const userEntry = {
        model_tag: 'user_info', // 使用特殊的 model_tag 来标识用户信息
        content: JSON.stringify({
          name: userInfo.name,
          gender,
          age,
          city: userInfo.city,
          occupation: userInfo.occupation,
          education: userInfo.education,
          phone: userInfo.phone || null,
          submit_time: new Date().toISOString(),
        }),
        metadata: {
          type: 'user_survey',
          status: 'pending',
        },
      };

      // 保存用户信息
      const result = await knowledgeBase.addEntry(userEntry);

      // 返回保存的用户信息
      res.json({
        data: {
          id: result.id,
          ...JSON.parse(result.content),
          created_at: result.created_at,
        },
      });
    } catch (error) {
      console.error('Error in user info API:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : '保存用户信息时发生错误',
      });
    }
  }

  // 获取用户信息
  async getUserInfo(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      // 获取知识库服务
      const knowledgeBase = ServiceFactory.createKnowledgeBase({
        type: 'supabase',
      });

      // 获取用户信息
      const entries = await knowledgeBase.getEntries('user_info');
      const userEntry = entries.find(entry => entry.id === userId);

      if (!userEntry) {
        return res.status(404).json({
          error: '未找到用户信息',
        });
      }

      // 返回用户信息
      res.json({
        data: {
          id: userEntry.id,
          ...JSON.parse(userEntry.content),
          created_at: userEntry.created_at,
        },
      });
    } catch (error) {
      console.error('Error getting user info:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : '获取用户信息时发生错误',
      });
    }
  }
} 