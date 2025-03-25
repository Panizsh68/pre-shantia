import { Test, TestingModule } from '@nestjs/testing';
import { ShahkarService } from './shahkar.service';

describe('ShahkarService', () => {
  let service: ShahkarService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShahkarService],
    }).compile();

    service = module.get<ShahkarService>(ShahkarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
