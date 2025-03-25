import { Test, TestingModule } from '@nestjs/testing';
import { ShahkarController } from './shahkar.controller';

describe('ShahkarController', () => {
  let controller: ShahkarController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShahkarController],
    }).compile();

    controller = module.get<ShahkarController>(ShahkarController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
