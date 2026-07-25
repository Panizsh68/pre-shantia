import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import defaultTestProviders from 'src/test/test-utils';
import { ForbiddenException } from '@nestjs/common';

describe('OrdersController', () => {
  let controller: OrdersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [...defaultTestProviders()],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('rejects reading another user\'s order', async () => {
    const service = {
      findById: jest.fn().mockResolvedValue({ userId: 'owner-id' }),
    };
    const protectedController = new OrdersController(service as any);

    await expect(
      protectedController.getById(
        { userId: 'ordinary-user-id', permissions: [{ resource: 'orders', actions: ['r'] }] } as any,
        'order-id',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
