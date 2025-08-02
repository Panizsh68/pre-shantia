import { Types } from 'mongoose';
import { ProductStatus } from '../enums/product-status.enum';

export interface IProduct {
  name: string;
  basePrice: number;
  companyId: Types.ObjectId;
  categories: Types.ObjectId[];
  description?: string;
  stock: { quantity: number };
  variants: { name: string; options: { value: string; priceModifier?: number }[] }[];
  attributes?: Record<string, string>;
  images: { url: string }[];
  comments?: string[];
  rating?: number;
  status: ProductStatus;
  deletedAt?: Date;
  finalPrice?: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
}
