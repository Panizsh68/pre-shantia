import { Test, TestingModule } from '@nestjs/testing';
import { TransportController } from './transportings.controller';
import defaultTestProviders from 'src/test/test-utils';
import { TransportService } from './transportings.service';

describe('TransportController', () => {
  let controller: TransportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransportController],
      providers: [
        ...defaultTestProviders(),
        {
          provide: 'ITransportService',
          useClass: TransportService,
        },
      ],
    }).compile();

    controller = module.get<TransportController>(TransportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
