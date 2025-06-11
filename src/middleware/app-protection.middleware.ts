import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import config from '../config';
import logger from '../utils/logger';

interface RequestInfo {
  ip: string;
  timestamp: number;
  count: number;
}

// 存储请求信息的内存缓存（生产环境建议使用Redis）
const requestCache = new Map<string, RequestInfo>();

export class AppProtectionMiddleware {
  
  // 1. Origin/Referer 检查 - 验证请求来源
  originCheck = (req: Request, res: Response, next: NextFunction) => {
    try {
      const origin = req.get('origin');
      const referer = req.get('referer');
      const allowedOrigins = config.security.allowed_origins;

      // 开发环境放宽限制
      if (config.env === 'development') {
        return next();
      }

      // 检查Origin
      if (origin && allowedOrigins.includes(origin)) {
        return next();
      }

      // 检查Referer（备选方案）
      if (referer) {
        const refererOrigin = new URL(referer).origin;
        if (allowedOrigins.includes(refererOrigin)) {
          return next();
        }
      }

      logger.warn(`Blocked request from unauthorized origin: ${origin || 'unknown'}, referer: ${referer || 'unknown'}`);
      
      return res.status(403).json({
        error: 'Access denied: Unauthorized origin',
        code: 'UNAUTHORIZED_ORIGIN'
      });
    } catch (error) {
      logger.error('Origin check error:', error);
      return res.status(500).json({
        error: 'Security check failed',
        code: 'SECURITY_ERROR'
      });
    }
  };

  // 2. 前端应用API Key验证
  frontendApiKey = (req: Request, res: Response, next: NextFunction) => {
    try {
      const apiKey = req.get('x-app-key') || req.get('x-frontend-key');
      
      if (!apiKey) {
        return res.status(401).json({
          error: 'Frontend API key required',
          code: 'MISSING_FRONTEND_KEY'
        });
      }

      if (apiKey !== config.security.frontend_api_key) {
        logger.warn(`Invalid frontend API key attempt: ${apiKey}`);
        return res.status(401).json({
          error: 'Invalid frontend API key',
          code: 'INVALID_FRONTEND_KEY'
        });
      }

      next();
    } catch (error) {
      logger.error('Frontend API key check error:', error);
      return res.status(500).json({
        error: 'API key validation failed',
        code: 'API_KEY_ERROR'
      });
    }
  };

  // 3. 请求签名验证（更高安全级别）
  requestSignature = (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = req.get('x-request-signature');
      const timestamp = req.get('x-timestamp');
      const nonce = req.get('x-nonce');

      if (!signature || !timestamp || !nonce) {
        return res.status(401).json({
          error: 'Request signature required',
          code: 'MISSING_SIGNATURE'
        });
      }

      // 检查时间戳（防重放攻击）
      const now = Date.now();
      const requestTime = parseInt(timestamp);
      const timeDiff = Math.abs(now - requestTime);
      
      if (timeDiff > config.security.signature_window) {
        return res.status(401).json({
          error: 'Request timestamp expired',
          code: 'TIMESTAMP_EXPIRED'
        });
      }

      // 生成期望的签名
      const method = req.method;
      const path = req.path;
      const bodyStr = req.method === 'POST' ? JSON.stringify(req.body) : '';
      const signatureData = `${method}|${path}|${bodyStr}|${timestamp}|${nonce}`;
      
      const expectedSignature = crypto
        .createHmac('sha256', config.security.signature_secret)
        .update(signatureData)
        .digest('hex');

      if (signature !== expectedSignature) {
        logger.warn(`Invalid request signature. Expected: ${expectedSignature}, Got: ${signature}`);
        return res.status(401).json({
          error: 'Invalid request signature',
          code: 'INVALID_SIGNATURE'
        });
      }

      next();
    } catch (error) {
      logger.error('Request signature validation error:', error);
      return res.status(500).json({
        error: 'Signature validation failed',
        code: 'SIGNATURE_ERROR'
      });
    }
  };

  // 4. 增强的速率限制（基于IP和指纹）
  enhancedRateLimit = (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.get('user-agent') || '';
      const fingerprint = crypto.createHash('md5').update(`${ip}|${userAgent}`).digest('hex');
      
      const now = Date.now();
      const windowMs = config.security.rate_limit_window;
      const maxRequests = config.security.rate_limit_max;

      // 清理过期记录
      for (const [key, info] of requestCache.entries()) {
        if (now - info.timestamp > windowMs) {
          requestCache.delete(key);
        }
      }

      // 检查当前请求
      const requestInfo = requestCache.get(fingerprint);
      
      if (!requestInfo) {
        // 首次请求
        requestCache.set(fingerprint, {
          ip,
          timestamp: now,
          count: 1
        });
        return next();
      }

      // 在时间窗口内
      if (now - requestInfo.timestamp < windowMs) {
        if (requestInfo.count >= maxRequests) {
          logger.warn(`Rate limit exceeded for ${ip}, fingerprint: ${fingerprint}`);
          return res.status(429).json({
            error: 'Too many requests',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil((windowMs - (now - requestInfo.timestamp)) / 1000)
          });
        }
        
        requestInfo.count++;
      } else {
        // 新的时间窗口
        requestInfo.timestamp = now;
        requestInfo.count = 1;
      }

      next();
    } catch (error) {
      logger.error('Enhanced rate limit error:', error);
      next(); // 不阻止请求，只记录错误
    }
  };

  // 5. User Agent检查
  userAgentCheck = (req: Request, res: Response, next: NextFunction) => {
    try {
      const userAgent = req.get('user-agent');
      
      if (!userAgent) {
        return res.status(400).json({
          error: 'User agent required',
          code: 'MISSING_USER_AGENT'
        });
      }

      // 检查是否为常见的爬虫或机器人
      const suspiciousPatterns = [
        /bot/i, /crawler/i, /spider/i, /scraper/i,
        /curl/i, /wget/i, /python/i, /postman/i
      ];

      const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
      
      if (isSuspicious && config.env === 'production') {
        logger.warn(`Blocked suspicious user agent: ${userAgent}`);
        return res.status(403).json({
          error: 'Access denied: Suspicious user agent',
          code: 'SUSPICIOUS_USER_AGENT'
        });
      }

      next();
    } catch (error) {
      logger.error('User agent check error:', error);
      next();
    }
  };

  // 6. 组合保护中间件 - 根据安全级别选择
  createProtection = (level: 'basic' | 'standard' | 'strict' = 'standard') => {
    const middlewares: Array<(req: Request, res: Response, next: NextFunction) => void> = [];

    switch (level) {
      case 'basic':
        middlewares.push(this.enhancedRateLimit);
        middlewares.push(this.userAgentCheck);
        break;
        
      case 'standard':
        middlewares.push(this.enhancedRateLimit);
        middlewares.push(this.originCheck);
        middlewares.push(this.frontendApiKey);
        middlewares.push(this.userAgentCheck);
        break;
        
      case 'strict':
        middlewares.push(this.enhancedRateLimit);
        middlewares.push(this.originCheck);
        middlewares.push(this.requestSignature);
        middlewares.push(this.userAgentCheck);
        break;
    }

    return middlewares;
  };

  // 7. 生成前端签名的辅助函数（可以暴露给前端文档）
  static generateSignature(method: string, path: string, body: string, timestamp: string, nonce: string, secret: string): string {
    const signatureData = `${method}|${path}|${body}|${timestamp}|${nonce}`;
    return crypto
      .createHmac('sha256', secret)
      .update(signatureData)
      .digest('hex');
  }
}

export default new AppProtectionMiddleware(); 