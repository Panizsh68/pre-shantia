import { Injectable } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { IOtpGenerator } from '../interfaces/otp-service.interface';

@Injectable()
export class OtpGenerator implements IOtpGenerator {
  generate(): string {
    return randomInt(100000, 1000000).toString();
  }
}
