import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { CachingService } from 'src/infrastructure/caching/caching.service';

export interface HealthReadinessResponse {
  ok: boolean;
  checks: { mongo: boolean; cache: boolean; redis: boolean; jwt: boolean };
}

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly cachingService: CachingService,
    private readonly jwtService: JwtService,
  ) {}

  async checkLiveness(): Promise<{ status: 'ok' }> {
    return { status: 'ok' };
  }

  async checkReadiness(): Promise<HealthReadinessResponse> {
    const mongoOk = this.connection.readyState === 1;
    let cacheOk = false;
    try { cacheOk = Boolean(this.cachingService.getStoreName()); } catch { cacheOk = false; }

    let redisOk = false;
    try {
      const key = `health-check-${Date.now()}`;
      const expected = `value-${Math.random()}`;
      await this.cachingService.set(key, expected, 300);
      redisOk = (await this.cachingService.get(key)) === expected;
    } catch { redisOk = false; }

    let jwtOk = false;
    try { jwtOk = Boolean(this.jwtService.decode(this.jwtService.sign({ health: true }))); } catch { jwtOk = false; }

    const checks = { mongo: mongoOk, cache: cacheOk, redis: redisOk, jwt: jwtOk };
    return { ok: Object.values(checks).every(Boolean), checks };
  }
}
