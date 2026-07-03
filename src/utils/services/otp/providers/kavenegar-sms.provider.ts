import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Kavenegar from 'kavenegar';
import { ISmsProvider } from '../interfaces/sms-provider.interface';
import { ISmsResponse } from '../interfaces/otp-service.interface';

@Injectable()
export class KavenegarSmsProvider implements ISmsProvider {
  private readonly logger = new Logger(KavenegarSmsProvider.name);
  private readonly kavenegarApi: any;
  private readonly template: string;
  private readonly sender: string;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('KAVENEGAR_API_KEY');
    
    // Strict requirement for API key to avoid stalling signup flows in restricted environments
    if (!apiKey || apiKey.length < 5 || apiKey.includes('your_')) {
      this.logger.warn('KAVENEGAR_API_KEY is not configured or looks invalid; SMS provider will operate in MOCK mode.');
      this.kavenegarApi = null;
      this.template = 'verify';
      this.sender = '10004346';
      this.enabled = false;
      return;
    }

    try {
      this.kavenegarApi = Kavenegar.KavenegarApi({
        apikey: apiKey,
      });
      this.template = this.configService.get<string>('KAVENEGAR_TEMPLATE', 'verify');
      this.sender = this.configService.get<string>('KAVENEGAR_SENDER', '10004346');
      this.enabled = true;
      this.logger.log('Kavenegar SMS Provider initialized successfully.');
    } catch (err) {
      this.logger.error('Failed to initialize Kavenegar SDK - falling back to mock mode', err);
      this.enabled = false;
    }
  }

  async sendTemplate(phoneNumber: string, template: string, otp: string): Promise<void> {
    if (!this.enabled || !this.kavenegarApi) {
      this.logger.log(`[MOCK SMS] receptor: ${phoneNumber}, otp: ${otp}, template: ${template}`);
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      // 10-second safety timeout to prevent hanging the entire signup transaction if external API is unreachable
      const timeout = setTimeout(() => {
        this.logger.error(`SMS send timed out for ${phoneNumber} - continuing signup anyway`);
        resolve(); // Continue to allow the user to exist even if SMS fails
      }, 10000);

      this.kavenegarApi.VerifyLookup({
        receptor: phoneNumber,
        token: otp,
        template: this.template
      }, (response: ISmsResponse, status: number) => {
        clearTimeout(timeout);
        if (status === 200 || response?.return?.status === 200) {
          this.logger.log(`SMS sent successfully to ${phoneNumber}`);
          resolve();
        } else {
          const msg = response?.return?.message || 'Unknown SMS provider error';
          this.logger.warn(`Kavenegar returned non-200 status (${status}): ${msg}`);
          // Don't reject - resolve to let user sign up, they can retry OTP or we can log it for admin
          resolve(); 
        }
      });
    });
  }

  async sendDirectMessage(phoneNumber: string, otp: string): Promise<string> {
    if (!this.enabled || !this.kavenegarApi) {
      this.logger.log(`[MOCK DIRECT SMS] receptor: ${phoneNumber}, message: Your code is ${otp}`);
      return Promise.resolve('Mock sent');
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve('Timed out'), 8000);
      this.kavenegarApi.Send({
        message: `کد تایید آریا ساخت: ${otp}`,
        sender: this.sender,
        receptor: phoneNumber
      }, (response: ISmsResponse, status: number) => {
        clearTimeout(timeout);
        if (status === 200) resolve('Sent');
        else resolve('Failed');
      });
    });
  }
}
