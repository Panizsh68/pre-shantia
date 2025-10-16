import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { ProductStatus } from '../enums/product-status.enum';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  versionKey: '__v'  // For future migrations
})
export class Product extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({
    required: true,
    unique: true,
    index: true,
    validate: {
      validator: function (v: string) {
        return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
      },
      message: 'Slug must be URL-friendly: lowercase letters, numbers, and hyphens only'
    }
  })
  slug: string;

  @Prop({ required: true, index: true })
  sku: string;

  @Prop({
    required: true,
    type: Number,
    min: 0,
    validate: {
      validator: function (v: number) {
        return Number.isFinite(v) && v >= 0;
      },
      message: 'Base price must be a non-negative number'
    }
  })
  basePrice: number;

  @Prop({
    type: Number,
    min: 0,
    max: 100,
    default: 0,
    validate: {
      validator: function (v: number) {
        return Number.isFinite(v) && v >= 0 && v <= 100;
      },
      message: 'Discount must be a number between 0 and 100'
    }
  })
  discount: number;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, index: true })
  companyId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Category' }], default: [] })
  categories: Types.ObjectId[];

  @Prop()
  description?: string;

  @Prop({ type: { quantity: { type: Number, default: 0, min: 0 } }, required: true })
  stock: {
    quantity: number;
  };

  @Prop([{
    name: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return v && v.length >= 2 && v.length <= 50;
        },
        message: 'Variant name must be between 2 and 50 characters'
      }
    },
    options: [{
      value: {
        type: String,
        required: true
      },
      priceModifier: {
        type: Number,
        validate: {
          validator: function (v: number | undefined) {
            return v === undefined || (Number.isFinite(v) && v >= 0);
          },
          message: 'Price modifier must be a non-negative number'
        }
      }
    }]
  }])
  variants: { name: string; options: { value: string; priceModifier?: number }[] }[];

  @Prop({ type: Map, of: String })
  attributes?: Record<string, string>;

  @Prop([{ url: String }])
  images: { url: string }[];

  @Prop([String])
  tags?: string[];

  @Prop([String])
  comments?: string[];

  @Prop({ min: 1, max: 5 })
  rating?: number;

  // Denormalized rating fields for fast reads and atomic updates
  @Prop({ type: Number, default: 0 })
  avgRate?: number;

  @Prop({ type: Number, default: 0 })
  totalRatings?: number;

  @Prop({ type: Object, default: {} })
  ratingsSummary?: Record<number, number>; // counts per rating value (1..5)

  @Prop([{
    userId: { type: Types.ObjectId, ref: 'User' },
    rating: { type: Number },
    comment: { type: String },
    createdAt: { type: Date },
  }])
  denormComments?: { userId?: Types.ObjectId; rating?: number; comment?: string; createdAt?: Date }[];

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

// Virtual fields
ProductSchema.virtual('finalPrice').get(function (this: Product) {
  const basePrice = this.basePrice || 0;
  const discount = Math.min(Math.max(this.discount || 0, 0), 100); // Clamp discount between 0-100
  const discountAmount = (basePrice * discount) / 100;
  const priceAfterDiscount = Math.max(basePrice - discountAmount, 0);

  // Apply variant price modifiers if any
  const variantModifiers = (this.variants || [])
    .flatMap(v => v.options)
    .map(o => o.priceModifier || 0)
    .filter(m => m > 0)
    .reduce((sum, mod) => sum + mod, 0);

  return Math.max(priceAfterDiscount + variantModifiers, 0);
});

// Compound indexes for common queries
ProductSchema.index({ companyId: 1, status: 1 });
ProductSchema.index({ basePrice: 1, status: 1 });
ProductSchema.index({ status: 1, updatedAt: -1 });
ProductSchema.index({ companyId: 1, categories: 1, status: 1 });

// Text index for search
ProductSchema.index({
  name: 'text',
  description: 'text',
  'attributes.$**': 'text',
  tags: 'text'
}, {
  weights: {
    name: 10,
    description: 5,
    'attributes.$**': 3,
    tags: 2
  },
  name: 'ProductTextIndex'
});
