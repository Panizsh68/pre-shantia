import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, HydratedDocument, Types } from 'mongoose';
import { ProductStatus } from '../enums/product-status.enum';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true, toJSON: { virtuals: true, getters: true }, toObject: { virtuals: true, getters: true } })
export class Product {

  @Prop({ required: true, index: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true, unique: true, index: true })
  sku: string;

  @Prop({ required: true, min: 0, type: Number })
  basePrice: number;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, index: true })
  companyId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Category' }], default: [] })
  categories: Types.ObjectId[];

  @Prop()
  description?: string;

  @Prop({
    type: {
      quantity: { type: Number, default: 0, min: 0 },
    },
    required: true,
  })
  stock: {
    quantity: number;
  };

  @Prop([
    {
      name: { type: String, required: true },
      options: [
        {
          value: { type: String, required: true },
          priceModifier: { type: Number, default: 0 },
        },
      ],
    },
  ])
  variants: {
    name: string;
    options: { value: string; priceModifier?: number }[];
  }[];

  @Prop({ type: Map, of: String })
  attributes: Record<string, string>;

  @Prop([String])
  tags: string[];

  @Prop([{ url: { type: String, required: true }}])
  images: { url: string }[];

  @Prop()
  subcategory?: string;

  @Prop([String])
  comments?: string[];

  @Prop({ min: 1, max: 5 })
  rating?: number;

  @Prop({
    enum: ProductStatus,
    type: String,
    default: ProductStatus.ACTIVE,
    index: true,
  })
  status: ProductStatus;

  @Prop()
  deletedAt?: Date;

  finalPrice?: number; // Virtual field
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Compound indexes for performance
ProductSchema.index({ companyId: 1, status: 1 });
ProductSchema.index({ categories: 1, basePrice: 1 });
ProductSchema.index({ slug: 1, companyId: 1 });
ProductSchema.index({ sku: 1 });

// Virtual for computed final price
ProductSchema.virtual('finalPrice').get(function (this: ProductDocument): number {
  // Ensure basePrice is treated as a number
  const basePrice = Number(this.basePrice) || 0;
  // Placeholder: Apply pricing rules or discounts
  return basePrice;
});

// Soft delete plugin
ProductSchema.pre('find', function () {
  this.where({ deletedAt: null });
});
ProductSchema.pre('findOne', function () {
  this.where({ deletedAt: null });
});