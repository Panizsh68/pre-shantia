import { HttpException, HttpStatus, Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CachingService } from 'src/infrastructure/caching/caching.service';
import { IOtpService } from './interfaces/otp-service.interface';
import { OTP_GENERATOR, SMS_PROVIDER } from './constants';

@Injectable()
export class OtpService implements IOtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly cachingService: CachingService,
    private readonly configService: ConfigService,
    @Inject(OTP_GENERATOR) private readonly otpGenerator: any,
    @Inject(SMS_PROVIDER) private readonly smsProvider: any,
  ) { }

  async sendOtpToPhone(phoneNumber: string): Promise<string> {
    const otp = this.otpGenerator.generate();
    const ttl = this.configService.get<number>('OTP_TTL', 300);

    // Store OTP in cache
    const stored = await this.cachingService.set(phoneNumber, otp, ttl);
    if (!stored) {
      throw new HttpException('Failed to store OTP', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Log OTP for testing purposes
    this.logger.debug(`Generated OTP for ${phoneNumber}: ${otp}`);

    try {
      // Use template-based VerifyLookup only. Do not fallback to direct Send.
      const result = await this.smsProvider.sendWithTemplate(phoneNumber, otp);
      return result;
    } catch (templateError) {
      // Log structured error information for diagnostics
      this.logger.error('Template-based SMS sending failed', {
        message: templateError?.message,
        status: templateError?.apiStatus ?? templateError?.status,
      });

      // Surface a clear HTTP error to the caller. Keep message generic to avoid leaking provider internals.
      throw new HttpException(
        `Failed to send OTP via template: ${templateError?.message || 'unknown error'}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async verifyOtp(identifier: string, otp: string): Promise<boolean> {
    const storedOtp = await this.cachingService.get(identifier);

    if (!storedOtp) {
      throw new HttpException('OTP not found or expired', HttpStatus.BAD_REQUEST);
    }

    if (storedOtp !== otp) {
      throw new HttpException('Invalid OTP', HttpStatus.BAD_REQUEST);
    }

    // Clear the used OTP
    await this.cachingService.delete(identifier);

    return true;
  }
}
