import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { CachingService } from 'src/infrastructure/caching/caching.service';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [OtpService, CachingService, ConfigService],
  exports: [OtpService],
})
export class OtpModule {}
