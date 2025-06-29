import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CachingService } from 'src/infrastructure/caching/caching.service';

@Injectable()
export class OtpService {
  private readonly tabanSmsUrl: string;
  private readonly tabanSmsKey: string;
  private readonly ttl: number;

  constructor(
    private cachingService: CachingService,
    private readonly configService: ConfigService,
  ) {
    this.tabanSmsUrl = this.configService.get<string>('TABAN_SMS_URL', '');
    this.tabanSmsKey = this.configService.get<string>('TABAN_SMS_key', '');
  }

  private generateOtp(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  async sendOtpToPhone(phoneNumber: string): Promise<string> {
    const otp = this.generateOtp();
    const ttl = this.configService.get<number>('app.OTP_TTL', 300);
    const sent = await this.cachingService.set(phoneNumber, otp, ttl);
    if (sent) {
      console.log(`Mock SMS sent to ${phoneNumber}: otp: ${otp}`);
    }
    try {
      return 'OTP sent successfully to phone';
    } catch (err) {
      throw new HttpException(`Failed to send SMS: ${err}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyOtp(identifier: string, otp: string): Promise<boolean> {
    const storedOtp = await this.cachingService.get(identifier);

    console.log(storedOtp, otp);
    if (!storedOtp) {
      throw new HttpException('otp not found', HttpStatus.BAD_REQUEST);
    }

    if (storedOtp !== otp) {
      throw new HttpException('otp not correct', HttpStatus.BAD_REQUEST);
    }

    return true;
  }
}
