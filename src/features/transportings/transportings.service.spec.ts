import { Test, TestingModule } from '@nestjs/testing';
import { TransportService } from './transportings.service';
import defaultTestProviders from 'src/test/test-utils';

describe('TransportService', () => {
  let service: TransportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransportService, ...defaultTestProviders()],
    }).compile();

    service = module.get<TransportService>(TransportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
