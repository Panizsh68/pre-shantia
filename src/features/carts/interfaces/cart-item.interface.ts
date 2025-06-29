import { DiscountType } from '../enums/discount-type.enum';

export interface ICartItem {
  productId: string;
  companyId: string;
  quantity: number;
  priceAtAdd: number;
  variant?: { name: string; value: string };
  notes?: string;
  discount?: {
    type: DiscountType;
    value: number;
  };
}
