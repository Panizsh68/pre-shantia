import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { CachingModule } from 'src/infrastructure/caching/caching.module';
import { OtpGenerator } from './providers/otp-generator.service';
import { KavenegarSmsProvider } from './providers/kavenegar-sms.provider';
import { OTP_GENERATOR, SMS_PROVIDER } from './constants';
import { ConfigService } from '@nestjs/config';
import { MockSmsProvider } from './providers/mock-sms.provider';
import { UnavailableSmsProvider } from './providers/unavailable-sms.provider';

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
        const nodeEnv = String(config.get<string>('NODE_ENV') || process.env.NODE_ENV || '').trim().toLowerCase();
        const mockEnabled = config.get<boolean | string>('MOCK_PROVIDERS_ENABLED') === true
          || String(config.get<boolean | string>('MOCK_PROVIDERS_ENABLED') ?? '').trim().toLowerCase() === 'true';
        if (mockEnabled && nodeEnv !== 'production') return new MockSmsProvider();

        const fixedOtpEnabled = config.get<boolean | string>('AUTH_FIXED_OTP_ENABLED') === true
          || String(config.get<boolean | string>('AUTH_FIXED_OTP_ENABLED') ?? '').trim().toLowerCase() === 'true';
        const smsConfigured = Boolean(
          config.get<string>('KAVENEGAR_API_KEY')?.trim()
          && config.get<string>('KAVENEGAR_TEMPLATE')?.trim(),
        );

        // The fixed OTP path never calls this provider for an allowlisted
        // phone. Keep all other phones fail-closed if Kavenegar is omitted.
        if (fixedOtpEnabled && !smsConfigured) return new UnavailableSmsProvider();
        return new KavenegarSmsProvider(config);
      },
    },
  ],
  exports: [OtpService],
})
export class OtpModule { }
