import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

@Injectable()
export class CachingService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async set<T>(key: string, value: T, ttl: number): Promise<boolean> {
    try {
      if (typeof ttl !== 'number' || isNaN(ttl)) {
        throw new Error(`Invalid TTL passed: ${ttl}`);
      }

      await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
      const cached = await this.redis.get(key);
      return cached !== null;
    } catch (e) {
      console.error(`Set failed for ${key}`, e);
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (e) {
      console.error(`Get failed for ${key}`, e);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (e) {
      console.error(`Delete failed for ${key}`, e);
    }
  }

  getStoreName(): string {
    return this.redis.status || 'unknown';
  }
}
