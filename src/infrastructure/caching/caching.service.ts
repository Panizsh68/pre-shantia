import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class CachingService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  
  // Get cached value
  async get<T>(key: string): Promise<T | null> {
    const value = await this.cacheManager.get<T>(key);
    return value ?? null;
  }

  
  // Set value in cache with TTL
  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    await this.cacheManager.set<T>(key, value, ttl);
  }

  
  // Delete cache entry
  async delete(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }
}
