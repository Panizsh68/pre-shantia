import { Test, TestingModule } from '@nestjs/testing';
import { TicketingController } from './ticketing.controller';
import defaultTestProviders from 'src/test/test-utils';
import { TicketingService } from './ticketing.service';

describe('TicketingController', () => {
  let controller: TicketingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketingController],
      providers: [TicketingService, ...defaultTestProviders()],
    }).compile();

    controller = module.get<TicketingController>(TicketingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
