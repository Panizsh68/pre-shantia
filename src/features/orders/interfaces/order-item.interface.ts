import { ProductVariantSelection } from '../../products/interfaces/variant-selection.interface';

export interface IOrderItem {
  productId: string;
  companyId: string;
  quantity: number;
  priceAtAdd: number;
  variant?: { name?: string; value?: string };
  variants?: ProductVariantSelection[];
}
