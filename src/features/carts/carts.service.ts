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
        { path: 'items.product', select: 'name basePrice description' },
        { path: 'items.companyId', select: 'name address' },
      ],
    };
    const cart = await this.cartRepository.findManyByCondition({ userId }, options);
    return cart;
  }

  async getPopulatedCartsForUser(userId: string): Promise<Cart[]> {
    const options: FindManyOptions = {
      populate: [
        { path: 'items.product', select: 'name basePrice description' },
        { path: 'items.companyId', select: 'name address' },
      ],
    };
    const carts = this.cartRepository.findManyByCondition({ userId }, options);
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
    return this.cartRepository.createOne(dto);
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
    return this.cartRepository.saveOne(cart);
  }

  async removeItemFromCart(userId: string, productId: string): Promise<ICart> {
    const cart = await this.cartRepository.findActiveCartByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Active cart not found');
    }
    cart.items = cart.items.filter(i => i.productId !== productId);
    return this.cartRepository.saveOne(cart);
  }

  async clearCart(userId: string): Promise<ICart> {
    const cart = await this.cartRepository.findActiveCartByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Active cart not found');
    }
    cart.items = [];
    return this.cartRepository.saveOne(cart);
  }

  async checkout(userId: string, session?: ClientSession): Promise<{ success: boolean; cartId: string }> {
    const cart = await this.cartRepository.findActiveCartByUserId(userId, session);
    if (!cart) {
      throw new NotFoundException('Active cart not found');
    }
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
    return this.cartRepository.saveOne(cart);
  }

  calculateTotal(items: CartItemDto[]): number {
    return items.reduce((total, item) => total + item.priceAtAdd * item.quantity, 0);
  }
}
