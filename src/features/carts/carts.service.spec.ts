import { Test, TestingModule } from '@nestjs/testing';
import { CartsService } from './carts.service';
import defaultTestProviders from 'src/test/test-utils';

describe('CartsService', () => {
  let service: CartsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CartsService, ...defaultTestProviders()],
    }).compile();

    service = module.get<CartsService>(CartsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('prices selected options on the server and keeps different selections separate', async () => {
    const cart = {
      items: [],
      currency: 'IRR',
      totalAmount: 0,
      save: jest.fn().mockResolvedValue(undefined),
    } as any;
    cart.save.mockResolvedValue(cart);
    const repository = {
      findOrCreateActiveCart: jest.fn().mockResolvedValue(cart),
    };
    const products = {
      findOne: jest.fn().mockResolvedValue({
        companyId: '507f1f77bcf86cd799439011',
        basePrice: 1000,
        discount: 10,
        currency: 'IRR',
        variants: [
          { name: 'رنگ', options: [{ value: 'قرمز', priceModifier: 100 }, { value: 'آبی', priceModifier: 0 }] },
          { name: 'سایز', options: [{ value: 'متوسط', priceModifier: 0 }] },
        ],
      }),
    };
    const localService = new CartsService(repository as any, products as any, {} as any);

    await localService.addItemToCart('user-1', {
      productId: 'product-1',
      companyId: '507f1f77bcf86cd799439011',
      quantity: 1,
      variants: [{ name: 'رنگ', value: 'قرمز' }, { name: 'سایز', value: 'متوسط' }],
    });
    await localService.addItemToCart('user-1', {
      productId: 'product-1',
      companyId: '507f1f77bcf86cd799439011',
      quantity: 1,
      priceAtAdd: 1,
      variants: [{ name: 'رنگ', value: 'آبی' }, { name: 'سایز', value: 'متوسط' }],
    });

    expect(cart.items).toHaveLength(2);
    expect(cart.items[0].priceAtAdd).toBe(1000);
    expect(cart.items[1].priceAtAdd).toBe(900);
  });

  it('rejects adding a product when a required option is missing', async () => {
    const cart = { items: [], currency: 'IRR', totalAmount: 0, save: jest.fn() } as any;
    const repository = { findOrCreateActiveCart: jest.fn().mockResolvedValue(cart) };
    const products = {
      findOne: jest.fn().mockResolvedValue({
        companyId: '507f1f77bcf86cd799439011',
        basePrice: 1000,
        variants: [{ name: 'رنگ', options: [{ value: 'قرمز', priceModifier: 0 }] }],
      }),
    };
    const localService = new CartsService(repository as any, products as any, {} as any);

    await expect(localService.addItemToCart('user-1', {
      productId: 'product-1',
      companyId: '507f1f77bcf86cd799439011',
      quantity: 1,
    })).rejects.toThrow('همه گزینه‌های خرید');
    expect(cart.save).not.toHaveBeenCalled();
  });
});
