import { Test, TestingModule } from '@nestjs/testing';
import { TransportingsController } from './transportings.controller';
import defaultTestProviders from 'src/test/test-utils';
import { TransportingsService } from './transportings.service';

describe('TransportingsController', () => {
  let controller: TransportingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransportingsController],
      providers: [TransportingsService, ...defaultTestProviders()],
    }).compile();

    controller = module.get<TransportingsController>(TransportingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
