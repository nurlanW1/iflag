// Configuration Service
// Database-driven configuration with caching

import Redis from 'ioredis';

export interface ConfigValue {
  value: any;
  description?: string;
  category?: string;
  isPublic?: boolean;
  updatedAt?: Date;
  updatedBy?: string;
}

export class ConfigService {
  private redis: Redis;
  private cache: Map<string, any> = new Map();
  private cacheTTL: number = 300; // 5 minutes

  constructor(redisUrl?: string) {
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
  }

  /**
   * Get configuration value
   */
  async get<T>(key: string, defaultValue?: T): Promise<T> {
    // Check memory cache first
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Check Redis cache
    const cached = await this.redis.get(`config:${key}`);
    if (cached) {
      const value = JSON.parse(cached);
      this.cache.set(key, value);
      return value;
    }

    // Load from database (would need database connection)
    // For now, return default
    if (defaultValue !== undefined) {
      this.cache.set(key, defaultValue);
      return defaultValue;
    }

    throw new Error(`Configuration key not found: ${key}`);
  }

  /**
   * Set configuration value
   */
  async set(key: string, value: any, userId?: string): Promise<void> {
    // Validate key format
    if (!/^[a-z0-9_.]+$/i.test(key)) {
      throw new Error('Invalid configuration key format');
    }

    // Update database (would need database connection)
    // await db.query('INSERT INTO system_config ...');

    // Update caches
    await this.redis.setex(`config:${key}`, this.cacheTTL, JSON.stringify(value));
    this.cache.set(key, value);

    // Emit event
    const { eventBus } = await import('./event-bus.js');
    await eventBus.emit('config:updated', { key, value, userId });
  }

  /**
   * Get all configuration keys
   */
  async getAll(category?: string): Promise<Record<string, any>> {
    // Load from database
    // For now, return empty object
    return {};
  }

  /**
   * Get public configuration (safe to expose to frontend)
   */
  async getPublic(): Promise<Record<string, any>> {
    // Load only public configs
    return {};
  }

  /**
   * Invalidate cache for a key
   */
  async invalidate(key: string): Promise<void> {
    await this.redis.del(`config:${key}`);
    this.cache.delete(key);
  }

  /**
   * Invalidate all caches
   */
  async invalidateAll(): Promise<void> {
    const keys = await this.redis.keys('config:*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
    this.cache.clear();
  }
}

// Singleton instance
export const configService = new ConfigService();
