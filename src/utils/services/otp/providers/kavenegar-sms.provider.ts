import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Kavenegar from 'kavenegar';
import { ISmsProvider, ISmsResponse } from '../interfaces/otp-service.interface';

@Injectable()
export class KavenegarSmsProvider implements ISmsProvider {
  private readonly logger = new Logger(KavenegarSmsProvider.name);
  private readonly kavenegarApi: any;
  private readonly template: string;
  private readonly sender: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('KAVENEGAR_API_KEY');
    if (!apiKey) {
      throw new Error('KAVENEGAR_API_KEY is not configured');
    }

    this.kavenegarApi = Kavenegar.KavenegarApi({
      apikey: apiKey,
    });
    this.template = this.configService.get<string>('KAVENEGAR_TEMPLATE', 'verify');
    this.sender = this.configService.get<string>('KAVENEGAR_SENDER', '10004346');
  }

  async sendWithTemplate(phoneNumber: string, otp: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.kavenegarApi.VerifyLookup({
        receptor: phoneNumber,
        token: otp,
        template: this.template
      }, (response: ISmsResponse, status: number) => {
        if (status === 200 && response?.return?.status === 200) {
          this.logger.debug(`Template SMS sent successfully: ${JSON.stringify(response.entries)}`);
          resolve('OTP sent successfully to phone');
        } else {
          reject(new Error(response?.return?.message || 'Failed to send template-based OTP'));
        }
      });
    });
  }

  async sendDirectMessage(phoneNumber: string, otp: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.kavenegarApi.Send({
        message: `کد تایید شما: ${otp}`,
        sender: this.sender,
        receptor: phoneNumber
      }, (response: ISmsResponse, status: number) => {
        if (status === 200 && response?.return?.status === 200) {
          this.logger.debug(`Direct SMS sent successfully: ${JSON.stringify(response.entries)}`);
          resolve('OTP sent successfully to phone');
        } else {
          reject(new Error(response?.return?.message || 'Failed to send direct OTP'));
        }
      });
    });
  }
}