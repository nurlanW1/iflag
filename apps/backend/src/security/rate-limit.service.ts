// Rate Limiting Service
// Multi-level rate limiting with Redis

import Redis from 'ioredis';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests in window
  keyGenerator?: (req: any) => string; // Custom key generator
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export class RateLimitService {
  private redis: any;
  private defaultConfig: RateLimitConfig = {
    windowMs: 60000, // 1 minute
    maxRequests: 100,
  };

  constructor(redisUrl?: string) {
    const Redis = require('ioredis');
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
  }

  /**
   * Check rate limit
   */
  async checkLimit(
    key: string,
    config: Partial<RateLimitConfig> = {}
  ): Promise<RateLimitResult> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const windowSeconds = Math.floor(finalConfig.windowMs / 1000);
    
    // Use sliding window log algorithm
    const now = Date.now();
    const windowStart = now - finalConfig.windowMs;

    // Remove old entries
    await this.redis.zremrangebyscore(key, 0, windowStart);

    // Count current requests
    const count = await this.redis.zcard(key);

    if (count >= finalConfig.maxRequests) {
      // Get oldest request time
      const oldest = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
      const oldestTime = oldest.length > 0 ? parseInt(oldest[1]) : now;
      const retryAfter = Math.ceil((oldestTime + finalConfig.windowMs - now) / 1000);

      return {
        allowed: false,
        remaining: 0,
        resetTime: oldestTime + finalConfig.windowMs,
        retryAfter,
      };
    }

    // Add current request
    await this.redis.zadd(key, now, `${now}-${Math.random()}`);
    await this.redis.expire(key, windowSeconds);

    return {
      allowed: true,
      remaining: finalConfig.maxRequests - count - 1,
      resetTime: now + finalConfig.windowMs,
    };
  }

  /**
   * Rate limit for IP address
   */
  async limitByIP(ip: string, config: Partial<RateLimitConfig> = {}): Promise<RateLimitResult> {
    const key = `rate_limit:ip:${ip}`;
    return this.checkLimit(key, config);
  }

  /**
   * Rate limit for user
   */
  async limitByUser(userId: string, config: Partial<RateLimitConfig> = {}): Promise<RateLimitResult> {
    const key = `rate_limit:user:${userId}`;
    return this.checkLimit(key, config);
  }

  /**
   * Rate limit for endpoint
   */
  async limitByEndpoint(
    endpoint: string,
    identifier: string,
    config: Partial<RateLimitConfig> = {}
  ): Promise<RateLimitResult> {
    const key = `rate_limit:endpoint:${endpoint}:${identifier}`;
    return this.checkLimit(key, config);
  }

  /**
   * Rate limit for login attempts
   */
  async limitLoginAttempts(identifier: string): Promise<RateLimitResult> {
    return this.limitByEndpoint('login', identifier, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 attempts
    });
  }

  /**
   * Rate limit for file uploads
   */
  async limitUploads(userId: string): Promise<RateLimitResult> {
    return this.limitByUser(userId, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 uploads per minute
    });
  }

  /**
   * Rate limit for admin operations
   */
  async limitAdminOperations(userId: string): Promise<RateLimitResult> {
    return this.limitByUser(userId, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 operations per minute
    });
  }

  /**
   * Reset rate limit for key
   */
  async resetLimit(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /**
   * Get rate limit status
   */
  async getStatus(key: string): Promise<{
    count: number;
    remaining: number;
    resetTime: number;
  }> {
    const count = await this.redis.zcard(key);
    const ttl = await this.redis.ttl(key);
    const resetTime = Date.now() + (ttl * 1000);

    return {
      count,
      remaining: Math.max(0, this.defaultConfig.maxRequests - count),
      resetTime,
    };
  }
}

export const rateLimitService = new RateLimitService();
