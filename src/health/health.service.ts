import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { CachingService } from 'src/infrastructure/caching/caching.service';

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly cachingService: CachingService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async checkLiveness(): Promise<{
    ok: boolean;
    timestamp: string;
  }> {
    return {
      ok: true,
      timestamp: new Date().toISOString(),
    };
  }

  async checkReadiness(): Promise<{
    ok: boolean;
    mongo: { ok: boolean; readyState: number };
    cache: { ok: boolean; store: string | null };
    redis: { ok: boolean; error: string | null };
    config: { ok: boolean; env: string | null; config: any };
    jwt: { ok: boolean };
  }> {
    // Mongo
    const mongo = { readyState: this.connection.readyState };
    const mongoOk = mongo.readyState === 1;

    // Cache
    let cacheStore: string | null = null;
    let cacheOk = false;
    try {
      cacheStore = this.cachingService.getStoreName();
      cacheOk = !!cacheStore;
    } catch (e) {
      cacheStore = null;
      cacheOk = false;
    }

    // Redis
    let redisOk = false;
    let redisError = null;
    try {
      const key = `health-check-${Date.now()}`;
      const expected = `value-${Math.random()}`;
      await this.cachingService.set(key, expected, 300);
      const stored = await this.cachingService.get(key);
      redisOk = stored === expected;
    } catch (err) {
      redisOk = false;
      redisError = err.message;
    }

    // Config
    let configOk = false;
    const configEnv = process.env.NODE_ENV || null;
    let configFull = null;
    try {
      const appConfig = this.configService.get('app');
      const prodConfig = this.configService.get('config');
      configFull = appConfig || prodConfig;
      configOk = !!configFull;
    } catch (e) {
      configOk = false;
    }

    // JWT
    let jwtOk = false;
    try {
      const jwtToken = this.jwtService.sign({ user: 'test' });
      const jwtDecoded = this.jwtService.decode(jwtToken);
      jwtOk = !!jwtDecoded;
    } catch (e) {
      jwtOk = false;
    }

    // Overall
    const allOk = mongoOk && cacheOk && redisOk && configOk && jwtOk;

    return {
      ok: allOk,
      mongo: { ok: mongoOk, readyState: mongo.readyState },
      cache: { ok: cacheOk, store: cacheStore },
      redis: { ok: redisOk, error: redisError },
      config: { ok: configOk, env: configEnv, config: configFull },
      jwt: { ok: jwtOk },
    };
  }
}
