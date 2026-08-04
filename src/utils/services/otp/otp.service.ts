import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { createHmac, randomUUID } from 'node:crypto';
import { CachingService } from 'src/infrastructure/caching/caching.service';
import { SMS_PROVIDER, OTP_GENERATOR } from './constants';
import { ISmsProvider } from './interfaces/sms-provider.interface';
import { IOtpGenerator } from './interfaces/otp-service.interface';
import { ConfigService } from '@nestjs/config';
import { RedactingLogger } from 'src/infrastructure/logging/redacting-logger';

@Injectable()
export class OtpService {
  private readonly logger = new RedactingLogger(OtpService.name);
  private readonly ttlSeconds: number;
  private readonly maxAttempts = 5;
  private readonly resendCooldownSeconds = 60;

  constructor(
    private readonly cachingService: CachingService,
    @Inject(SMS_PROVIDER) private readonly smsProvider: ISmsProvider,
    @Inject(OTP_GENERATOR) private readonly otpGenerator: IOtpGenerator,
    private readonly configService: ConfigService,
  ) {
    this.ttlSeconds = Math.max(60, Math.min(600, this.configService.get<number>('OTP_TTL') || 300));
  }

  private digest(phoneNumber: string, otp: string): string {
    const key = this.configService.get<string>('ENCRYPTION_KEY') || 'development-only-otp-key';
    return createHmac('sha256', key).update(`${phoneNumber}:${otp}`).digest('hex');
  }

  async sendOtpToPhone(phoneNumber: string): Promise<void> {
    const cooldownKey = `otp:cooldown:${phoneNumber}`;
    if (!(await this.cachingService.setIfAbsent(cooldownKey, '1', this.resendCooldownSeconds))) {
      throw new HttpException('Please wait before requesting another code', HttpStatus.TOO_MANY_REQUESTS);
    }
    const challengeKey = `otp:challenge:${phoneNumber}`;
    const otp = this.otpGenerator.generate();
    const challengeId = randomUUID();
    await this.cachingService.setRaw(challengeKey, `${challengeId}|${this.digest(phoneNumber, otp)}|0`, this.ttlSeconds);
    const nodeEnv = this.configService.get<string>('NODE_ENV')?.toLowerCase();
    const debugOtpLogs = this.configService.get<string>('OTP_DEBUG_LOGS') === 'true';
    const shouldLogOtp = nodeEnv === 'development' || (debugOtpLogs && nodeEnv !== 'production');
    if (shouldLogOtp) this.logger.debugOtp(otp, true);
    try {
      await this.smsProvider.sendTemplate(phoneNumber, 'verify', otp);
    } catch {
      await this.cachingService.delete(challengeKey);
      throw new HttpException('OTP delivery is temporarily unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async verifyOtp(identifier: string, otp: string): Promise<boolean> {
    const result = await this.cachingService.verifyOtpChallenge(
      `otp:challenge:${identifier}`, '', this.digest(identifier, otp), this.maxAttempts,
    );
    if (result !== 'valid') throw new HttpException('Invalid or expired OTP', HttpStatus.BAD_REQUEST);
    return true;
  }
}
