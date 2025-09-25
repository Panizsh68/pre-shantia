import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { ProductStatus } from '../enums/product-status.enum';

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Product extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: Number, min: 0 })
  basePrice: number;

  @Prop({ type: Number, min: 0, max: 100, default: 0 })
  discount: number;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Category' }], default: [] })
  categories: Types.ObjectId[];

  @Prop()
  description?: string;

  @Prop({ type: { quantity: { type: Number, default: 0, min: 0 } }, required: true })
  stock: {
    quantity: number;
  };

  @Prop([{ name: String, options: [{ value: String, priceModifier: Number }] }])
  variants: { name: string; options: { value: string; priceModifier?: number }[] }[];

  @Prop({ type: Map, of: String })
  attributes?: Record<string, string>;

  @Prop([{ url: String }])
  images: { url: string }[];

  @Prop([String])
  comments?: string[];

  @Prop({ min: 1, max: 5 })
  rating?: number;

  @Prop({ enum: ProductStatus, type: String, default: ProductStatus.ACTIVE })
  status: ProductStatus;

  @Prop()
  deletedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  updatedBy: Types.ObjectId;
}
export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.virtual('finalPrice').get(function (this: Product) {
  return this.basePrice - (this.basePrice * (this.discount || 0)) / 100;
});
