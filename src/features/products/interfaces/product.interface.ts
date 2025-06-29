import { ProductStatus } from '../enums/product-status.enum';

export interface IProduct {
  name: string;
  basePrice: number;
  companyId: string;
  categories?: string[];
  description?: string;
  stock: {
    quantity: number;
  };
  variants: {
    name: string;
    options: { value: string; priceModifier?: number }[];
  }[];
  attributes?: Record<string, string>;
  tags?: string[];
  images: { url: string }[];
  subcategory?: string;
  comments?: string[];
  rating?: number;
  status: ProductStatus;
  deletedAt?: Date;
  finalPrice?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
