import { Test, TestingModule } from '@nestjs/testing';
import { TransportingsService } from './transportings.service';
import defaultTestProviders from 'src/test/test-utils';

describe('TransportingsService', () => {
  let service: TransportingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransportingsService, ...defaultTestProviders()],
    }).compile();

    service = module.get<TransportingsService>(TransportingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
