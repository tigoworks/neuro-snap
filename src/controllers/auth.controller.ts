import { Request, Response } from 'express';
import { SupabaseService } from '../services/supabase.service';
import authMiddleware from '../middleware/auth.middleware';
import logger from '../utils/logger';

export class AuthController {
  private supabaseService: SupabaseService;

  constructor() {
    this.supabaseService = SupabaseService.getInstance();
  }

  // 用户注册
  async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required',
          code: 'MISSING_CREDENTIALS'
        });
      }

      // 使用Supabase进行用户注册
      const { data, error } = await this.supabaseService.getClient().auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || '',
          }
        }
      });

      if (error) {
        return res.status(400).json({
          error: error.message,
          code: 'REGISTRATION_FAILED'
        });
      }

      logger.info(`User registered successfully: ${email}`);
      
      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
        session: data.session
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        code: 'SERVER_ERROR'
      });
    }
  }

  // 用户登录
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required',
          code: 'MISSING_CREDENTIALS'
        });
      }

      // 使用Supabase进行用户登录
      const { data, error } = await this.supabaseService.getClient().auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return res.status(401).json({
          error: error.message,
          code: 'LOGIN_FAILED'
        });
      }

      // 也可以生成自定义JWT token
      const customToken = authMiddleware.generateJWT({
        userId: data.user.id,
        email: data.user.email!,
        role: data.user.user_metadata?.role || 'user'
      });

      logger.info(`User logged in successfully: ${email}`);
      
      res.json({
        message: 'Login successful',
        user: {
          id: data.user.id,
          email: data.user.email,
          role: data.user.user_metadata?.role || 'user'
        },
        // Supabase session token
        session: data.session,
        // 自定义JWT token (可选)
        token: customToken
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        error: 'Login failed',
        code: 'SERVER_ERROR'
      });
    }
  }

  // 验证token
  async validateToken(req: Request, res: Response) {
    try {
      // 这个方法会被auth middleware调用后执行
      // req.user 已经被设置
      res.json({
        valid: true,
        user: req.user
      });
    } catch (error) {
      logger.error('Token validation error:', error);
      res.status(500).json({
        error: 'Token validation failed',
        code: 'SERVER_ERROR'
      });
    }
  }

  // 刷新token
  async refreshToken(req: Request, res: Response) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          error: 'Refresh token is required',
          code: 'MISSING_REFRESH_TOKEN'
        });
      }

      const { data, error } = await this.supabaseService.getClient().auth.refreshSession({
        refresh_token
      });

      if (error) {
        return res.status(401).json({
          error: error.message,
          code: 'REFRESH_FAILED'
        });
      }

      res.json({
        message: 'Token refreshed successfully',
        session: data.session
      });
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(500).json({
        error: 'Token refresh failed',
        code: 'SERVER_ERROR'
      });
    }
  }

  // 登出
  async logout(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        // 使用Supabase登出
        await this.supabaseService.getClient().auth.signOut();
      }

      res.json({
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        error: 'Logout failed',
        code: 'SERVER_ERROR'
      });
    }
  }

  // 获取当前用户信息
  async getCurrentUser(req: Request, res: Response) {
    try {
      res.json({
        user: req.user
      });
    } catch (error) {
      logger.error('Get current user error:', error);
      res.status(500).json({
        error: 'Failed to get user info',
        code: 'SERVER_ERROR'
      });
    }
  }
} 