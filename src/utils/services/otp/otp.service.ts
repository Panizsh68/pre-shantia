import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { createHmac, randomUUID } from 'node:crypto';
import { CachingService } from 'src/infrastructure/caching/caching.service';
import { SMS_PROVIDER, OTP_GENERATOR } from './constants';
import { ISmsProvider } from './interfaces/sms-provider.interface';
import { IOtpGenerator } from './interfaces/otp-service.interface';
import { ConfigService } from '@nestjs/config';
import { RedactingLogger } from 'src/infrastructure/logging/redacting-logger';
import { normalizeIranianPhone } from 'src/common/utils/iranian-identifiers';

@Injectable()
export class OtpService {
  private readonly logger = new RedactingLogger(OtpService.name);
  private readonly ttlSeconds: number;
  private readonly maxAttempts = 5;
  private readonly resendCooldownSeconds = 60;
  private readonly fixedOtpEnabled: boolean;
  private readonly fixedOtp: string;
  private readonly fixedOtpAllowedPhones: Set<string>;

  constructor(
    private readonly cachingService: CachingService,
    @Inject(SMS_PROVIDER) private readonly smsProvider: ISmsProvider,
    @Inject(OTP_GENERATOR) private readonly otpGenerator: IOtpGenerator,
    private readonly configService: ConfigService,
  ) {
    this.ttlSeconds = Math.max(60, Math.min(600, this.configService.get<number>('OTP_TTL') || 300));
    const configuredEnabled = this.configService.get<boolean | string>('AUTH_FIXED_OTP_ENABLED');
    this.fixedOtpEnabled = configuredEnabled === true
      || String(configuredEnabled ?? '').trim().toLowerCase() === 'true';
    this.fixedOtp = String(this.configService.get<string>('AUTH_FIXED_OTP') ?? '').trim();
    this.fixedOtpAllowedPhones = new Set(
      String(this.configService.get<string>('AUTH_FIXED_OTP_ALLOWED_PHONES') ?? '')
        .split(',')
        .map((phone) => normalizeIranianPhone(phone.trim()))
        .filter(Boolean),
    );
  }

  /** Temporary, server-only bypass for explicitly allowlisted test phones. */
  isFixedOtpEnabledForPhone(phoneNumber: string): boolean {
    return this.fixedOtpEnabled
      && /^\d{6}$/.test(this.fixedOtp)
      && this.fixedOtpAllowedPhones.has(normalizeIranianPhone(phoneNumber));
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
    const fixedOtp = this.isFixedOtpEnabledForPhone(phoneNumber);
    const otp = fixedOtp ? this.fixedOtp : this.otpGenerator.generate();
    const challengeId = randomUUID();
    await this.cachingService.setRaw(challengeKey, `${challengeId}|${this.digest(phoneNumber, otp)}|0`, this.ttlSeconds);
    const nodeEnv = String(this.configService.get('NODE_ENV') || '').toLowerCase();
    const debugOtpLogs = String(this.configService.get('OTP_DEBUG_LOGS') || '').toLowerCase() === 'true';
    const shouldLogOtp = nodeEnv === 'development' || (debugOtpLogs && nodeEnv !== 'production');
    if (shouldLogOtp) this.logger.debugOtp(otp, true);
    if (!fixedOtp) {
      try {
        await this.smsProvider.sendTemplate(phoneNumber, 'verify', otp);
      } catch {
        await this.cachingService.delete(challengeKey);
        throw new HttpException('OTP delivery is temporarily unavailable', HttpStatus.SERVICE_UNAVAILABLE);
      }
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
