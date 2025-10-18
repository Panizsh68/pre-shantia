import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { CachingModule } from 'src/infrastructure/caching/caching.module';
import { OtpGenerator } from './providers/otp-generator.service';
import { KavenegarSmsProvider } from './providers/kavenegar-sms.provider';
import { OTP_GENERATOR, SMS_PROVIDER } from './constants';

@Module({
  imports: [CachingModule],
  providers: [
    OtpService,
    {
      provide: OTP_GENERATOR,
      useClass: OtpGenerator,
    },
    {
      provide: SMS_PROVIDER,
      useClass: KavenegarSmsProvider,
    },
  ],
  exports: [OtpService],
})
export class OtpModule { }
