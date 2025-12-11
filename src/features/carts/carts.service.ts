// carts.service.ts
import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Types, ClientSession } from 'mongoose';
import { CartStatus } from './enums/cart-status.enum';
import { IProductService } from '../products/interfaces/product.service.interface';
import { ICartRepository } from './repositories/carts.repository';
import { ICartsService } from './interfaces/carts-service.interface';
import { CartItemDto } from './dto/cart-item.dto';
import { CreateCartDto } from './dto/create-cart.dto';
import { Cart } from './entities/cart.entity';
import { ICart } from './interfaces/cart.interface';
import { FindManyOptions } from 'src/libs/repository/interfaces/base-repo-options.interface';
import { CartSummary } from './interfaces/cart-summary.interface';

@Injectable()
export class CartsService implements ICartsService {
  constructor(
    @Inject('CartRepository') private readonly cartRepository: ICartRepository,
    @Inject('IProductsService') private readonly productsService: IProductService,
  ) { }

  async getUserActiveCart(userId: string, session?: any): Promise<ICart> {
    return this.cartRepository.findActiveCartByUserId(userId, session);
  }

  async getPopulatedCartsForUserById(userId: string): Promise<Cart[]> {
    const options: FindManyOptions = {
      populate: [
        { path: 'items.productId', select: 'name basePrice description' },
        { path: 'items.companyId', select: 'name address' },
      ],
    };
    const cart = await this.cartRepository.findManyByCondition({ userId }, options);
    return cart;
  }

  async getPopulatedCartsForUser(userId: string): Promise<Cart[]> {
    const options: FindManyOptions = {
      populate: [
        { path: 'items.productId', select: 'name basePrice description' },
        { path: 'items.companyId', select: 'name address' },
      ],
    };
    const carts = await this.cartRepository.findManyByCondition({ userId }, options);
    return carts;
  }

  async getCartSummaryByUser(userId: string): Promise<CartSummary[]> {
    const pipeline = [
      { $match: { userId } },
      {
        $group: {
          _id: '$userId',
          totalItems: { $sum: { $size: '$items' } },
          totalValue: { $sum: '$computedTotal' },
        },
      },
    ];

    return this.cartRepository.aggregate<CartSummary>(pipeline);
  }

  async createCart(dto: CreateCartDto): Promise<ICart> {
    // compute totalAmount from items if not provided
    const total = dto.totalAmount ?? this.calculateTotal(dto.items as CartItemDto[]);
    const payload = { ...dto, totalAmount: total };
    return this.cartRepository.createOne(payload as any);
  }

  async addItemToCart(userId: string, item: CartItemDto): Promise<ICart> {
    const cart = await this.cartRepository.findActiveCartByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Active cart not found');
    }
    // validate companyId presence and format
    if (!item.companyId) {
      throw new NotFoundException('companyId is required for cart items');
    }
    if (!Types.ObjectId.isValid(item.companyId)) {
      throw new BadRequestException(`Invalid companyId format: ${item.companyId}`);
    }
    // verify the product exists and belongs to the companyId
    const product = await this.productsService.findOne(item.productId);
    if (!product) { throw new NotFoundException(`Product with id ${item.productId} not found`); }
    if (product.companyId?.toString() !== item.companyId) {
      throw new BadRequestException('Product does not belong to the provided companyId');
    }
    cart.items.push(item);
    // Recalculate total including discounts
    cart.totalAmount = this.calculateTotal(cart.items as CartItemDto[]);
    return this.cartRepository.saveOne(cart);
  }

  async removeItemFromCart(userId: string, productId: string): Promise<ICart> {
    const cart = await this.cartRepository.findActiveCartByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Active cart not found');
    }
    cart.items = cart.items.filter(i => i.productId !== productId);
    cart.totalAmount = this.calculateTotal(cart.items as CartItemDto[]);
    return this.cartRepository.saveOne(cart);
  }

  async clearCart(userId: string): Promise<ICart> {
    const cart = await this.cartRepository.findActiveCartByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Active cart not found');
    }
    cart.items = [];
    cart.totalAmount = 0;
    return this.cartRepository.saveOne(cart);
  }

  async checkout(userId: string, session?: ClientSession): Promise<{ success: boolean; cartId: string }> {
    const cart = await this.cartRepository.findActiveCartByUserId(userId, session);
    if (!cart) {
      throw new NotFoundException('Active cart not found');
    }
    // ensure totals are up-to-date before checkout
    cart.totalAmount = this.calculateTotal(cart.items as CartItemDto[]);
    cart.status = CartStatus.CHECKED_OUT;
    await this.cartRepository.saveOne(cart, session);
    return { success: true, cartId: cart.id };
  }

  async updateCart(userId: string, cartData: Partial<Cart>): Promise<ICart> {
    const cart = await this.cartRepository.findActiveCartByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Active cart not found');
    }
    Object.assign(cart, cartData);
    // Recalculate total if items changed or totalAmount not provided
    cart.totalAmount = this.calculateTotal(cart.items as CartItemDto[]);
    return this.cartRepository.saveOne(cart);
  }

  private validateDiscount(discount: { type: string; value: number } | undefined): void {
    if (!discount) return;
    const { type, value } = discount as any;
    if (!type || (type !== 'percentage' && type !== 'fixed')) {
      throw new BadRequestException('Invalid discount type');
    }
    if (typeof value !== 'number' || value < 0) {
      throw new BadRequestException('Invalid discount value');
    }
    if (type === 'percentage' && value > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100');
    }
  }

  private calculateItemTotal(item: CartItemDto): number {
    // validate and compute per-item total including discount
    this.validateDiscount(item.discount as any);
    const base = item.priceAtAdd * item.quantity;
    if (!item.discount) return base;
    const { type, value } = item.discount as any;
    if (type === 'percentage') {
      const discountAmount = (base * value) / 100;
      return Math.max(0, base - discountAmount);
    }
    // fixed: interpret value as fixed amount per item
    const discountAmount = value * item.quantity;
    return Math.max(0, base - discountAmount);
  }

  calculateTotal(items: CartItemDto[]): number {
    if (!Array.isArray(items) || items.length === 0) return 0;
    return items.reduce((total, item) => total + this.calculateItemTotal(item), 0);
  }
}
