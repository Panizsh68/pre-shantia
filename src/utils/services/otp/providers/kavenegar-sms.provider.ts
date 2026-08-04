import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Kavenegar from 'kavenegar';
import { ISmsProvider } from '../interfaces/sms-provider.interface';
import { ISmsResponse } from '../interfaces/otp-service.interface';

@Injectable()
export class KavenegarSmsProvider implements ISmsProvider {
  private readonly kavenegarApi: any;
  private readonly template: string;

  constructor(configService: ConfigService) {
    const apiKey = configService.get<string>('KAVENEGAR_API_KEY')?.trim();
    this.template = configService.get<string>('KAVENEGAR_TEMPLATE')?.trim() || '';
    if (!apiKey || !this.template) throw new Error('SMS provider unavailable');
    try {
      this.kavenegarApi = Kavenegar.KavenegarApi({ apikey: apiKey });
    } catch {
      throw new Error('SMS provider unavailable');
    }
  }

  async sendTemplate(phoneNumber: string, _template: string, otp: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('SMS provider unavailable')), 10000);
      this.kavenegarApi.VerifyLookup({ receptor: phoneNumber, token: otp, template: this.template },
        (response: ISmsResponse, status: number) => {
          clearTimeout(timeout);
          if (status === 200 || response?.return?.status === 200) resolve();
          else reject(new Error('SMS provider rejected request'));
        });
    });
  }
}
