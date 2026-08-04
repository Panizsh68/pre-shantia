import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { CachingModule } from 'src/infrastructure/caching/caching.module';
import { OtpGenerator } from './providers/otp-generator.service';
import { KavenegarSmsProvider } from './providers/kavenegar-sms.provider';
import { OTP_GENERATOR, SMS_PROVIDER } from './constants';
import { ConfigService } from '@nestjs/config';
import { MockSmsProvider } from './providers/mock-sms.provider';

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
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const mockEnabled = config.get<boolean>('MOCK_PROVIDERS_ENABLED') === true && process.env.NODE_ENV !== 'production';
        return mockEnabled ? new MockSmsProvider() : new KavenegarSmsProvider(config);
      },
    },
  ],
  exports: [OtpService],
})
export class OtpModule { }
