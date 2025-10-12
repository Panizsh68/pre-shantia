import { Test, TestingModule } from '@nestjs/testing';
import { WalletsService } from './wallets.service';
import defaultTestProviders from 'src/test/test-utils';

describe('WalletsService', () => {
  let service: WalletsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WalletsService, ...defaultTestProviders()],
    }).compile();

    service = module.get<WalletsService>(WalletsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
