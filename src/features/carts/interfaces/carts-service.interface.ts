import { Cart } from '../entities/cart.entity';
import { ICart } from '../interfaces/cart.interface';
import { CartItemDto } from '../dto/cart-item.dto';
import { CreateCartDto } from '../dto/create-cart.dto';
import { CartSummary } from './cart-summary.interface';

export interface ICartsService {
  getUserActiveCart(userId: string): Promise<ICart>;
  getPopulatedCartsForUserById(userId: string): Promise<Cart[]>;
  getPopulatedCartsForUser(userId: string): Promise<Cart[]>;
  getCartSummaryByUser(userId: string): Promise<CartSummary[]>;
  createCart(dto: CreateCartDto): Promise<ICart>;
  addItemToCart(userId: string, item: CartItemDto): Promise<ICart>;
  removeItemFromCart(userId: string, productId: string): Promise<ICart>;
  clearCart(userId: string): Promise<ICart>;
  checkout(userId: string): Promise<{ success: boolean; cartId: string }>;
  updateCart(userId: string, cartData: Partial<Cart>): Promise<ICart>;
  calculateTotal(items: CartItemDto[]): number;
}
