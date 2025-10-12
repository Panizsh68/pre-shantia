import { Test, TestingModule } from '@nestjs/testing';
import { TicketingService } from './ticketing.service';
import defaultTestProviders from 'src/test/test-utils';

describe('TicketingService', () => {
  let service: TicketingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TicketingService, ...defaultTestProviders()],
    }).compile();

    service = module.get<TicketingService>(TicketingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
