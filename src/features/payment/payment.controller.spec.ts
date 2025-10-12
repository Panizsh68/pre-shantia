import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import defaultTestProviders from 'src/test/test-utils';

describe('PaymentController', () => {
  let controller: PaymentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [...defaultTestProviders()],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
