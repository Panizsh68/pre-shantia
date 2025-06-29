import { Test, TestingModule } from '@nestjs/testing';
import { ZarinpalService } from './zarinpal.service';

describe('ZarinpalService', () => {
  let service: ZarinpalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZarinpalService],
    }).compile();

    service = module.get<ZarinpalService>(ZarinpalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
