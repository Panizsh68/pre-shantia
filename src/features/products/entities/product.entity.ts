import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';
import { ProductStatus } from '../enums/product-status.enum';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, getters: true },
  toObject: { virtuals: true, getters: true },
})
export class Product extends Document {
  @ApiProperty({ description: 'Name of the product', example: 'Laptop' })
  @Prop({ required: true, index: true })
  name: string;

  @ApiProperty({ description: 'Base price of the product', example: 1000 })
  @Prop({ required: true, min: 0, type: Number })
  basePrice: number;

  @ApiProperty({ description: 'Discount percentage for the product', example: 10 })
  @Prop({ type: Number, min: 0, max: 100, default: 0 })
  discount: number;

  @ApiProperty({
    description: 'Company ID associated with the product',
    example: '507f1f77bcf86cd799439011',
  })
  @Prop({ type: String, ref: 'Company', required: true, index: true })
  companyId: string;

  @ApiProperty({
    description: 'Categories associated with the product',
    example: ['Electronics', 'Computers'],
  })
  @Prop({ type: [{ type: String, ref: 'Category' }], default: [] })
  categories: string[];

  @ApiProperty({ description: 'Description of the product', example: 'A high-performance laptop' })
  @Prop()
  description?: string;

  @ApiProperty({ description: 'Stock information of the product' })
  @Prop({
    type: {
      quantity: { type: Number, default: 0, min: 0 },
    },
    required: true,
  })
  stock: {
    quantity: number;
  };

  @ApiProperty({ description: 'Variants of the product' })
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

  @ApiProperty({ description: 'Attributes of the product', example: { color: 'red', size: 'M' } })
  @Prop({ type: Map, of: String })
  attributes: Record<string, string>;

  @ApiProperty({ description: 'Images of the product' })
  @Prop([{ url: { type: String, required: true } }])
  images: { url: string }[];

  @ApiProperty({
    description: 'Comments on the product',
    example: ['Great product!', 'Highly recommended'],
  })
  @Prop([String])
  comments?: string[];

  @ApiProperty({ description: 'Rating of the product', example: 4.5 })
  @Prop({ min: 1, max: 5 })
  rating?: number;

  @ApiProperty({
    description: 'Status of the product',
    enum: ProductStatus,
    example: ProductStatus.ACTIVE,
  })
  @Prop({
    enum: ProductStatus,
    type: String,
    default: ProductStatus.ACTIVE,
    index: true,
  })
  status: ProductStatus;

  @ApiProperty({
    description: 'Date when the product was deleted',
    example: '2023-10-01T00:00:00.000Z',
  })
  @Prop()
  deletedAt?: Date;

  @ApiProperty({ description: 'Final price of the product after applying discount', example: 900 })
  finalPrice?: number; // Virtual field
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.virtual('finalPrice').get(function (this: Product) {
  const discountAmount = (this.basePrice * (this.discount || 0)) / 100;
  return this.basePrice - discountAmount;
});
