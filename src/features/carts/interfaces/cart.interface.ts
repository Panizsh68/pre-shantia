import { CartStatus } from '../enums/cart-status.enum';
import { ICartItem } from './cart-item.interface';

export interface ICart {
  id?: string;
  userId: string;
  items: ICartItem[];
  totalAmount: number;
  status: CartStatus;
  createdAt?: Date;
  updatedAt?: Date;
}
