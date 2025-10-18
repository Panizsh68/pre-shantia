import { Injectable } from '@nestjs/common';
import { IOtpGenerator } from '../interfaces/otp-service.interface';

@Injectable()
export class OtpGenerator implements IOtpGenerator {
  generate(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }
}