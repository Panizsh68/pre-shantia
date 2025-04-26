import { Test, TestingModule } from '@nestjs/testing';
import { GoftinoController } from './goftino.controller';
import { GoftinoService } from './services/goftino.service';

describe('GoftinoController', () => {
  let controller: GoftinoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoftinoController],
      providers: [GoftinoService],
    }).compile();

    controller = module.get<GoftinoController>(GoftinoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
