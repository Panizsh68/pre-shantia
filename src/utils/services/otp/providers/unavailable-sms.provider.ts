import { Injectable } from '@nestjs/common';
import { ISmsProvider } from '../interfaces/sms-provider.interface';

/**
 * Keeps the application bootable while the temporary fixed-OTP bypass is
 * enabled. Non-allowlisted phones still fail closed instead of receiving a
 * fake or silently accepted OTP.
 */
@Injectable()
export class UnavailableSmsProvider implements ISmsProvider {
  async sendTemplate(): Promise<void> {
    throw new Error('SMS provider unavailable');
  }
}
