import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ShahkarService {
  private readonly logger = new Logger(ShahkarService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly isEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('SHAHKAR_BASE_URL', '');
    this.apiKey = this.configService.get<string>('SHAHKAR_API_KEY', '');
    
    // Safety check to avoid blocking registration in dev if Shahkar is not configured
    this.isEnabled = !!(this.baseUrl && this.apiKey && !this.apiKey.includes('your_'));
  }

  /**
   * Verifies if the provided National ID (MeliCode) belongs to the owner of the phone number.
   * This is a critical regulatory requirement for B2B industrial platforms in Iran.
   */
  async verifyMelicodeWithPhonenumber(meliCode: string, phoneNumber: string): Promise<boolean> {
    if (!this.isEnabled) {
      this.logger.warn(`[ShahkarService] MOCK MODE ACTIVE: Skipping verification for ${phoneNumber}.`);
      return true;
    }

    try {
      this.logger.log(`[ShahkarService] Verifying identity for phone ${phoneNumber}...`);
      
      const response = await axios.post(
        this.baseUrl,
        {
          nationalCode: meliCode,
          mobile: phoneNumber,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      if (response.data?.status === 'verified' || response.data?.result === true) {
        this.logger.log(`[ShahkarService] SUCCESS: Identity verified for ${phoneNumber}.`);
        return true;
      }

      this.logger.warn(`[ShahkarService] FAILED: Identity mismatch for ${phoneNumber}.`);
      return false;
    } catch (err) {
      this.logger.error(`[ShahkarService] API Error: ${err.response?.data?.message || err.message}`);
      throw new HttpException(
        err.response?.data?.message || 'Shahkar verification service is temporarily unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
