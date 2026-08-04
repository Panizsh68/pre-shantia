import { Injectable } from '@nestjs/common';

@Injectable()
export class MockShahkarService {
  async verifyMelicodeWithPhonenumber(_meliCode: string, _phoneNumber: string): Promise<boolean> {
    return true;
  }
}
