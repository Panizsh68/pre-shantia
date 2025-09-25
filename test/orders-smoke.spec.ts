import 'reflect-metadata';
import { OrdersService } from '../src/features/orders/orders.service';
import { OrderFactoryService } from '../src/features/orders/order-factory.service';
import { CreateOrderDto } from '../src/features/orders/dto/create-order.dto';
import { CartItemDto } from '../src/features/carts/dto/cart-item.dto';
import { ICartsService } from '../src/features/carts/interfaces/carts-service.interface';
import { IWalletService } from '../src/features/wallets/interfaces/wallet.service.interface';
import { IOrderRepository } from '../src/features/orders/repositories/order.repository';
import { ICart } from '../src/features/carts/interfaces/cart.interface';

// Minimal smoke test using in-memory mocks for repositories/services
describe('OrdersService smoke', () => {
  it('should create orders and checkout cart atomically (mocked)', async () => {
    const userId = 'user1';
    const cart: ICart = {
      id: 'cart1',
      userId,
      items: [
        { productId: 'p1', companyId: 'c1', quantity: 1, priceAtAdd: 100 },
        { productId: 'p2', companyId: 'c1', quantity: 2, priceAtAdd: 50 },
      ],
      status: 'active',
    } as unknown as ICart;

    const cartsServiceMockPlain = {
      getUserActiveCart: jest.fn().mockResolvedValue(cart),
      getPopulatedCartsForUserById: jest.fn(),
      getPopulatedCartsForUser: jest.fn(),
      getCartSummaryByUser: jest.fn(),
      createCart: jest.fn(),
      addItemToCart: jest.fn(),
      removeItemFromCart: jest.fn(),
      clearCart: jest.fn(),
      checkout: jest.fn().mockResolvedValue({ success: true, cartId: cart.id }),
      updateCart: jest.fn(),
      calculateTotal: (items: CartItemDto[]) => items.reduce((s, it) => s + it.priceAtAdd * it.quantity, 0),
    };
    const cartsServiceMock = cartsServiceMockPlain as unknown as jest.Mocked<ICartsService>;

    const walletsServiceMockPlain = { transfer: jest.fn().mockResolvedValue(undefined) };
    const walletsServiceMock = walletsServiceMockPlain as unknown as jest.Mocked<IWalletService>;

    const orderRepoPlain = {
      startTransaction: jest.fn().mockResolvedValue({}),
      createOne: jest.fn().mockImplementation((dto: Record<string, unknown>) => ({ ...dto, id: 'order_' + Math.random() })),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      abortTransaction: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      findManyByCondition: jest.fn(),
      findAll: jest.fn(),
      createOneAndPopulate: jest.fn(),
      aggregate: jest.fn(),
      existsByCondition: jest.fn(),
      countByCondition: jest.fn(),
    };
    const orderRepositoryMock = orderRepoPlain as unknown as jest.Mocked<IOrderRepository>;

    const orderFactory = new OrderFactoryService();
    const ordersService = new OrdersService(cartsServiceMock, walletsServiceMock, orderRepositoryMock, orderFactory);

    const createDto = { userId, shippingAddress: 'addr', paymentMethod: 'pm' } as unknown as CreateOrderDto;
    const result = await ordersService.create(createDto);

    expect(cartsServiceMock.getUserActiveCart).toHaveBeenCalledWith(userId);
    expect(result.length).toBeGreaterThan(0);
    expect(cartsServiceMock.checkout).toHaveBeenCalledWith(userId, expect.anything());
  });

  it('should confirm delivery and trigger wallet transfer (mocked)', async () => {
    const userId = 'user1';
    const orderId = 'order123';
    const companyId = 'company42';
    const totalPrice = 500;

    const orderRepoPlain = {
      startTransaction: jest.fn().mockResolvedValue({}),
      findById: jest.fn().mockResolvedValue({ id: orderId, userId, companyId, status: 'delivered', totalPrice }),
      updateById: jest.fn().mockImplementation((id: string, data: Record<string, unknown>) => ({ id, ...data })),
      createOne: jest.fn(),
      findManyByCondition: jest.fn(),
      findAll: jest.fn(),
      deleteById: jest.fn(),
      createOneAndPopulate: jest.fn(),
      aggregate: jest.fn(),
      existsByCondition: jest.fn(),
      countByCondition: jest.fn(),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      abortTransaction: jest.fn().mockResolvedValue(undefined),
    };
    const orderRepoMock = orderRepoPlain as unknown as jest.Mocked<IOrderRepository>;

    const walletsServicePlain = { transfer: jest.fn().mockResolvedValue(undefined) };
    const walletsMock = walletsServicePlain as unknown as jest.Mocked<IWalletService>;

    const cartsServicePlain = { getUserActiveCart: jest.fn() };
    const cartsMock = cartsServicePlain as unknown as jest.Mocked<ICartsService>;

    const orderFactory = new OrderFactoryService();
    const ordersService = new OrdersService(cartsMock, walletsMock, orderRepoMock, orderFactory);

    const result = await ordersService.confirmDelivery(orderId, userId);

    // assert against the original plain mock functions to avoid casting
    expect(orderRepoPlain.findById).toHaveBeenCalledWith(orderId, expect.any(Object));
    expect(walletsServicePlain.transfer).toHaveBeenCalledWith(
      { ownerId: 'INTERMEDIARY_ID', ownerType: expect.any(String) },
      { ownerId: companyId.toString(), ownerType: expect.any(String) },
      totalPrice,
      expect.any(Object),
    );
  });
});
