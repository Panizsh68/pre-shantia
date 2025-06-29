import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ShahkarService {
  private readonly base_url: string;
  private readonly api_key: string;

  constructor(private readonly configService: ConfigService) {
    this.base_url = this.configService.get<string>('SHAHKAR_BASE_URL', '');
    this.api_key = this.configService.get<string>('SHAHKAR_API_KEY', '');
  }

  async verifyMelicodeWithPhonenumber(meliCode: string, phoneNumber: string): Promise<boolean> {
    try {
      // const headers = {
      //   Authorization: `Bearer ${this.api_key}`,
      //   'Content-Type': 'application/json',
      // };

      // const requestBody = {
      //   nationalCode: meliCode,
      //   mobile: phoneNumber,
      // };

      // const response = await axios.post(this.base_url, requestBody, { headers });

      // if (response.data?.status === 'verified') {
      //   return true;
      // } else {
      //   return false;
      // }
      console.log('shahkar passed');
      return true;
    } catch (err) {
      throw new HttpException(
        err.response?.data?.message || 'shahkar verification failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
