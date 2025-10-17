import { Types } from 'mongoose';
import { ProductStatus } from '../enums/product-status.enum';

export interface IProduct {
  slug: string;
  sku: string;
  name: string;
  basePrice: number;
  companyId: Types.ObjectId | { _id: Types.ObjectId; name: string };
  categories: (Types.ObjectId | { _id: Types.ObjectId; name: string })[];
  description?: string;
  stock: { quantity: number };
  variants: { name: string; options: { value: string; priceModifier?: number }[] }[];
  attributes?: Record<string, string>;
  images: { url: string }[];
  tags?: string[];
  status: ProductStatus;
  deletedAt?: Date;
  finalPrice?: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
}
