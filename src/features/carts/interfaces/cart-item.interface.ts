import { DiscountType } from '../enums/discount-type.enum';

export interface ICartItem {
  productId: string;
  quantity: number;
  priceAtAdd: number;
  variant?: { name: string; value: string };
  notes?: string;

}
