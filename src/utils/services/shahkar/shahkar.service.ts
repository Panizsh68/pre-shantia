import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ShahkarService {
  private readonly enabled: boolean;
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(configService: ConfigService) {
    this.enabled = configService.get<boolean>('SHAHKAR_ENABLED') === true;
    this.baseUrl = configService.get<string>('SHAHKAR_BASE_URL')?.trim() || '';
    this.apiKey = configService.get<string>('SHAHKAR_API_KEY')?.trim() || '';
  }

  async verifyMelicodeWithPhonenumber(meliCode: string, phoneNumber: string): Promise<boolean> {
    if (!this.enabled || !this.baseUrl || !this.apiKey) throw new HttpException('Identity verification is temporarily unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    try {
      const response = await axios.post(this.baseUrl, { nationalCode: meliCode, mobile: phoneNumber }, {
        headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' }, timeout: 5000,
      });
      return response.data?.status === 'verified' || response.data?.result === true;
    } catch {
      throw new HttpException('Identity verification is temporarily unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
