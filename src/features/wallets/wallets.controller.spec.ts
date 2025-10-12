import { Test, TestingModule } from '@nestjs/testing';
import { WalletsController } from './wallets.controller';
import defaultTestProviders from 'src/test/test-utils';
import { WalletsService } from './wallets.service';

describe('WalletsController', () => {
  let controller: WalletsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletsController],
      providers: [WalletsService, ...defaultTestProviders()],
    }).compile();

    controller = module.get<WalletsController>(WalletsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
