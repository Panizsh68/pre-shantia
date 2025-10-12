import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import defaultTestProviders from 'src/test/test-utils';

describe('TransactionService', () => {
  let service: TransactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionService, ...defaultTestProviders()],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
