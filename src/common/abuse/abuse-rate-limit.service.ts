import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { CachingService } from 'src/infrastructure/caching/caching.service';

export interface RateLimitResult { allowed: boolean; limit: number; remaining: number; retryAfterSeconds: number; }

@Injectable()
export class AbuseRateLimitService {
  constructor(private readonly cache: CachingService, private readonly config: ConfigService) {}

  async consume(name: string, identity: string, configPrefix: string): Promise<RateLimitResult> {
    const limits = this.config.get<Record<string, number>>('RATE_LIMITS') || {};
    const limit = Number(limits[`${configPrefix}_MAX`] || 1);
    const windowSeconds = Number(limits[`${configPrefix}_WINDOW_SECONDS`] || 60);
    const digest = createHash('sha256').update(identity).digest('hex');
    const result = await this.cache.incrementRateLimit(`abuse:${name}:${digest}`, windowSeconds);
    return { allowed: result.count <= limit, limit, remaining: Math.max(0, limit - result.count), retryAfterSeconds: result.retryAfterSeconds };
  }
}
