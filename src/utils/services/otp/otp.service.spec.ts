import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from './otp.service';
import defaultTestProviders from 'src/test/test-utils';

describe('OtpService', () => {
  let service: OtpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OtpService, ...defaultTestProviders()],
    }).compile();

    service = module.get<OtpService>(OtpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
