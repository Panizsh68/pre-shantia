import { Injectable, Logger, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { CachingService } from 'src/infrastructure/caching/caching.service';
import { SMS_PROVIDER } from './constants';
import { ISmsProvider } from './interfaces/sms-provider.interface';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly cachingService: CachingService,
    @Inject(SMS_PROVIDER) private readonly smsProvider: ISmsProvider,
  ) {}

  private generateOtp(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  async sendOtpToPhone(phoneNumber: string): Promise<void> {
    const otp = this.generateOtp();
    this.logger.debug(`Generated OTP for ${phoneNumber}: ${otp}`);

    await this.cachingService.set(phoneNumber, otp, 600); // 10 minutes TTL

    try {
      await this.smsProvider.sendTemplate(phoneNumber, 'verify', otp);
    } catch (error) {
      this.logger.error('SMS sending failed', error);
      throw new HttpException(
        `Failed to send OTP: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
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

    await this.cachingService.delete(identifier);

    return true;
  }
}
