import { Injectable } from '@nestjs/common';
import { ISmsProvider } from '../interfaces/sms-provider.interface';

@Injectable()
export class MockSmsProvider implements ISmsProvider {
  async sendTemplate(_phoneNumber: string, _template: string, _otp: string): Promise<void> {}
}
