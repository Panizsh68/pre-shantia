import { Controller, Get, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { CachingService } from 'src/infrastructure/caching/caching.service';

@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly cachingService: CachingService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Get('mongo')
  checkMongoConnection() {
    return {
      readyState: this.connection.readyState,
    };
  }

  @Get('cache-store')
  checkCacheStore() {
    const storeName = this.cachingService.getStoreName();
    return { storeName };
  }

  @Get('redis')
  async checkRedis() {
    const key = `health-check-${Date.now()}`;
    const expected = `value-${Math.random()}`;

    try {
      const storeName = this.cachingService.getStoreName();
      const setResult = await this.cachingService.set(key, expected, 300);
      const stored = await this.cachingService.get(key);
      const isMatch = stored === expected;

      return {
        storeName,
        key,
        expected,
        stored,
        isMatch,
        redis: isMatch && setResult,
      };
    } catch (err) {
      return { redis: false, error: err.message };
    }
  }

  @Get('config')
  checkConfig() {
    const appConfig = this.configService.get('app');
    return {
      fullConfig: appConfig,
    };
  }

  @Get('jwt')
  checkJwt() {
    const token = this.jwtService.sign({ user: 'test' });
    const decoded = this.jwtService.decode(token);
    return { token, decoded };
  }
}
