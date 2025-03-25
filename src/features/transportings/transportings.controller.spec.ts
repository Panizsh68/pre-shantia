import { Test, TestingModule } from '@nestjs/testing';
import { TransportingsController } from './transportings.controller';
import { TransportingsService } from './transportings.service';

describe('TransportingsController', () => {
  let controller: TransportingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransportingsController],
      providers: [TransportingsService],
    }).compile();

    controller = module.get<TransportingsController>(TransportingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
