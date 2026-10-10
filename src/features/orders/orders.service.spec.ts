import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { OrderFactoryService } from './order-factory.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ICartsService } from '../carts/interfaces/carts-service.interface';
import { IWalletService } from '../wallets/interfaces/wallet.service.interface';
import { IOrderRepository } from './repositories/order.repository';
import { ICart } from '../carts/interfaces/cart.interface';
import { CartItemDto } from '../carts/dto/cart-item.dto';
import { CartStatus } from '../carts/enums/cart-status.enum';

describe('OrdersService (unit)', () => {
  let service: OrdersService;

  beforeEach(async () => {
    // create a sample cart with items from two different companies
    const userId = 'user1';
    const cart: ICart = {
      id: 'cart1',
      userId,
      items: [
        { productId: '507f1f77bcf86cd799439011', companyId: 'c1', quantity: 1, priceAtAdd: 100 },
        { productId: '507f1f77bcf86cd799439012', companyId: 'c2', quantity: 2, priceAtAdd: 50 },
      ] as CartItemDto[],
      totalAmount: 200,
      status: CartStatus.ACTIVE,
    } as unknown as ICart;

    const cartsServiceMockPlain: Partial<ICartsService> = {
      getUserActiveCart: jest.fn().mockResolvedValue(cart),
      checkout: jest.fn().mockResolvedValue({ success: true, cartId: cart.id }),
      calculateTotal: (items: CartItemDto[]) => items.reduce((s, it) => s + Number(it.priceAtAdd || 0) * it.quantity, 0),
    };
    const cartsServiceMock = cartsServiceMockPlain as unknown as ICartsService;

    const walletsServiceMockPlain: Partial<IWalletService> = { transfer: jest.fn().mockResolvedValue(undefined) };
    const walletsServiceMock = walletsServiceMockPlain as unknown as IWalletService;

    const orderRepoPlain: Partial<IOrderRepository> = {
      startTransaction: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockImplementation((order) => ({ ...order, id: 'order_' + Math.random() })),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      abortTransaction: jest.fn().mockResolvedValue(undefined),
    };
    const orderRepositoryMock = orderRepoPlain as IOrderRepository;
    const productRepositoryMock = {
      findManyByCondition: jest.fn().mockResolvedValue([
        { id: '507f1f77bcf86cd799439011', basePrice: 100, discount: 0, variants: [] },
        { id: '507f1f77bcf86cd799439012', basePrice: 50, discount: 0, variants: [] },
      ]),
      bulkDecrementStock: jest.fn().mockResolvedValue(2),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: 'ICartsService',
          useValue: cartsServiceMock,
        },
        {
          provide: 'IWalletsService',
          useValue: walletsServiceMock,
        },
        {
          provide: 'OrderRepository',
          useValue: orderRepositoryMock,
        },
        {
          provide: 'IProductsService',
          useValue: {},
        },
        {
          provide: 'ProductRepository',
          useValue: productRepositoryMock,
        },
        OrderFactoryService,
        {
          provide: 'IOrdersService',
          useClass: OrdersService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>('IOrdersService' as any) as unknown as OrdersService;
  });

  it('creates orders grouped by company and checks out the cart atomically', async () => {
    const dto: CreateOrderDto = {
      userId: 'user1',
      shippingAddress: 'addr',
      paymentMethod: 'zibal',
      items: [],
      totalPrice: 0,
      companyId: '',
      status: undefined as any,
    } as unknown as CreateOrderDto;

    const orders = await service.create(dto);
    // There should be two orders (two companies)
    expect(orders.length).toBe(2);

    // cartsService.checkout should have been called through the flow
    const cartsService = (service as any).cartsService as ICartsService;
    expect(cartsService.checkout).toHaveBeenCalledWith(dto.userId, expect.any(Object));

    // Ensure repository createOne was called for each company
    const repo = (service as any).orderRepository as IOrderRepository;
    expect(repo.create).toHaveBeenCalledTimes(2);
  });

  it('normalizes populated cart references before creating an order', async () => {
    const productId = '507f1f77bcf86cd799439011';
    const companyId = '507f1f77bcf86cd799439013';
    const cartsService = (service as any).cartsService as ICartsService;
    const productRepository = (service as any).productRepository;

    (cartsService.getUserActiveCart as jest.Mock).mockResolvedValueOnce({
      userId: 'user1',
      items: [{
        productId: { _id: productId, name: 'محصول تست' },
        companyId: { _id: companyId, name: 'شرکت تست' },
        quantity: 1,
        priceAtAdd: 100,
      }],
      totalAmount: 100,
      status: CartStatus.ACTIVE,
    });
    (productRepository.findManyByCondition as jest.Mock).mockResolvedValueOnce([
      { _id: productId, basePrice: 100, discount: 0, variants: [] },
    ]);
    (productRepository.bulkDecrementStock as jest.Mock).mockResolvedValueOnce(1);

    const orders = await service.create({ userId: 'user1' } as any);

    expect(orders).toHaveLength(1);
    expect(orders[0].companyId).toBe(companyId);
    expect(orders[0].items[0].productId).toBe(productId);
  });

  it('preserves fields from Mongoose-like cart item subdocuments', async () => {
    const productId = '507f1f77bcf86cd799439011';
    const companyId = '507f1f77bcf86cd799439013';
    const item = Object.create(null) as Record<string, unknown>;
    Object.defineProperties(item, {
      productId: { value: { _id: productId }, enumerable: false },
      companyId: { value: { _id: companyId }, enumerable: false },
      quantity: { value: 1, enumerable: false },
      priceAtAdd: { value: 100, enumerable: false },
      toObject: {
        value: () => ({
          productId: { _id: productId },
          companyId: { _id: companyId },
          quantity: 1,
          priceAtAdd: 100,
        }),
        enumerable: false,
      },
    });

    const cartsService = (service as any).cartsService as ICartsService;
    const productRepository = (service as any).productRepository;
    (cartsService.getUserActiveCart as jest.Mock).mockResolvedValueOnce({
      userId: 'user1',
      items: [item],
      totalAmount: 100,
      status: CartStatus.ACTIVE,
    });
    (productRepository.findManyByCondition as jest.Mock).mockResolvedValueOnce([
      { _id: productId, basePrice: 100, discount: 0, variants: [] },
    ]);
    (productRepository.bulkDecrementStock as jest.Mock).mockResolvedValueOnce(1);

    const orders = await service.create({ userId: 'user1' } as any);

    expect(orders).toHaveLength(1);
    expect(orders[0].items[0].quantity).toBe(1);
    expect(orders[0].userId).toBe('user1');
  });

  it('throws when cart is empty', async () => {
    // override getUserActiveCart to return empty
    const cartsService = (service as any).cartsService as ICartsService;
    (cartsService.getUserActiveCart as jest.Mock).mockResolvedValueOnce({ items: [] });

    await expect(service.create({ userId: 'user1' } as any)).rejects.toThrow();
  });
});
