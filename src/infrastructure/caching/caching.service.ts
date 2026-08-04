import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

@Injectable()
export class CachingService {
  constructor(@InjectRedis() private readonly redis: Redis) { }

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

  async setIfAbsent(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.redis.set(key, value, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async setRaw(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    return (await this.redis.set(key, value, 'EX', ttlSeconds)) === 'OK';
  }

  async verifyOtpChallenge(key: string, challengeId: string, digest: string, maxAttempts: number): Promise<'valid' | 'invalid' | 'expired' | 'locked'> {
    const script = `
      local value = redis.call('get', KEYS[1])
      if not value then return -1 end
      local first = string.find(value, '|', 1, true)
      local second = string.find(value, '|', first + 1, true)
      local id = string.sub(value, 1, first - 1)
      local storedDigest = string.sub(value, first + 1, second - 1)
      local attempts = tonumber(string.sub(value, second + 1)) or 0
      if storedDigest == ARGV[2] then redis.call('del', KEYS[1]); return 1 end
      attempts = attempts + 1
      if attempts >= tonumber(ARGV[3]) then redis.call('del', KEYS[1]); return -2 end
      redis.call('set', KEYS[1], id .. '|' .. storedDigest .. '|' .. attempts, 'XX', 'KEEPTTL')
      return 0
    `;
    const result = Number(await this.redis.eval(script, 1, key, challengeId, digest, String(maxAttempts)));
    if (result === 1) return 'valid';
    if (result === -1) return 'expired';
    if (result === -2) return 'locked';
    return 'invalid';
  }

  async incrementRateLimit(key: string, windowSeconds: number): Promise<{ count: number; retryAfterSeconds: number }> {
    const script = `
      local count = redis.call('incr', KEYS[1])
      if count == 1 then redis.call('expire', KEYS[1], ARGV[1]) end
      local ttl = redis.call('ttl', KEYS[1])
      return { count, ttl }
    `;
    const result = await this.redis.eval(script, 1, key, String(windowSeconds)) as [number, number];
    return { count: Number(result[0]), retryAfterSeconds: Math.max(1, Number(result[1])) };
  }

  // Acquire a simple lock using SET NX with an auto-expire TTL (seconds).
  // Returns a lock token string when acquired, otherwise null.
  async acquireLock(key: string, ttlSeconds = 5): Promise<string | null> {
    const token = Math.random().toString(36).slice(2);
    try {
      // use raw call to allow NX/EX without overload issues
      const result = await this.redis.call('set', key, token, 'NX', 'EX', String(ttlSeconds));
      if (result === 'OK') {return token;}
      return null;
    } catch (e) {
      console.error(`acquireLock failed for ${key}`, e);
      return null;
    }
  }

  // Release a lock only if the token matches (safe delete using Lua script).
  async releaseLock(key: string, token: string): Promise<boolean> {
    const lua = `if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end`;
    try {
      const res = await this.redis.eval(lua, 1, key, token);
      return res === 1;
    } catch (e) {
      console.error(`releaseLock failed for ${key}`, e);
      return false;
    }
  }

  getStoreName(): string {
    return this.redis.status || 'unknown';
  }
}
