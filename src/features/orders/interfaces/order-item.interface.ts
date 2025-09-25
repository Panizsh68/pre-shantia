export interface IOrderItem {
  productId: string;
  companyId: string;
  quantity: number;
  priceAtAdd: number;
  variant?: { name?: string; value?: string };
}
