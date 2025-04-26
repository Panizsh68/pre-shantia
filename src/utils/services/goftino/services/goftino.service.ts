import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from 'src/common/logger/logger.service';
import { User } from '../interfaces/user.interface';
import axios, { AxiosInstance } from 'axios';

const userStore: Map<string, User> = new Map();

@Injectable()
export class GoftinoService {
  private readonly apiClient: AxiosInstance;
  private readonly apiUrl: string ;
  private readonly apiKey: string ;

  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {
      const apiUrl = this.configService.get<string>('GOFTINO_API_URL')
      const apiKey = this.configService.get<string>('GOFTINO_API_KEY')

      if ( !apiUrl || !apiKey) {
        this.loggerService.error('GOFTINO_API_URL or GOFTINO_API_KEY is missing', '', 'GoftinoService')
        throw new BadRequestException('Missing Goftino API configuration')
      }

      this.apiUrl = apiUrl;
      this.apiKey = apiKey;
      this.apiClient = axios.create({
        baseURL: this.apiUrl,
        headers: {
          'Content-Type': 'application/json',
          'goftino-key': this.apiKey
        }
      })
  }

  getApiClient() {
    return this.apiClient;
  }
  
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'goftino-key': this.apiKey
    }
  }

}
