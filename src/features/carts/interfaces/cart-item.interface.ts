import { DiscountType } from '../enums/discount-type.enum';
import { ProductVariantSelection } from '../../products/interfaces/variant-selection.interface';

export interface ICartItem {
  productId: string;
  companyId: string;
  quantity: number;
  priceAtAdd: number;
  variant?: { name: string; value: string };
  variants?: ProductVariantSelection[];
  notes?: string;
  discount?: { type: DiscountType; value: number };
}
