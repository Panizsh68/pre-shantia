import { Global, Module } from '@nestjs/common';
import { AbuseRateLimitGuard } from './abuse-rate-limit.guard';
import { AbuseRateLimitService } from './abuse-rate-limit.service';

@Global()
@Module({ providers: [AbuseRateLimitService, AbuseRateLimitGuard], exports: [AbuseRateLimitService, AbuseRateLimitGuard] })
export class AbuseControlModule {}
