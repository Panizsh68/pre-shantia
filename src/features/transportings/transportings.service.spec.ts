import { Test, TestingModule } from '@nestjs/testing';
import { TransportingsService } from './transportings.service';

describe('TransportingsService', () => {
  let service: TransportingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransportingsService],
    }).compile();

    service = module.get<TransportingsService>(TransportingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
