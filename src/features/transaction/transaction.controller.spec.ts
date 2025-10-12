import { Test, TestingModule } from '@nestjs/testing';
import { TransactionController } from './transaction.controller';
import defaultTestProviders from 'src/test/test-utils';

describe('TransactionController', () => {
  let controller: TransactionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [...defaultTestProviders()],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
