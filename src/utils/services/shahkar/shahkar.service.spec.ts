import { Test, TestingModule } from '@nestjs/testing';
import { ShahkarService } from './shahkar.service';
import defaultTestProviders from 'src/test/test-utils';

describe('ShahkarService', () => {
  let service: ShahkarService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShahkarService, ...defaultTestProviders()],
    }).compile();

    service = module.get<ShahkarService>(ShahkarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
