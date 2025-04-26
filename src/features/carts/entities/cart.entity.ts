// src/carts/schemas/cart.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CartStatus } from '../enums/cart-status.enum';

export type CartDocument = HydratedDocument<Cart>;

@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({
    type: [{
      productId: { type: Types.ObjectId, ref: 'Product', required: true },
      companyId: { type: Types.ObjectId, ref: 'Company', required: true },
      quantity: { type: Number, required: true, min: 1 },
      priceAtAdd: { type: Number, required: true, min: 0 },
    }],
    required: true,
    default: [],
  })
  items: {
    productId: Types.ObjectId;
    companyId: Types.ObjectId;
    quantity: number;
    priceAtAdd: number;
  }[];

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  totalAmount: number;

  @Prop({ type: String, enum: CartStatus, required: true, default: 'active' })
  status: string;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

// Indexes
CartSchema.index({ userId: 1 }, { unique: true });
CartSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days TTL for abandoned carts

// Sharding: Configure at MongoDB level with shard key: { userId: "hashed" }