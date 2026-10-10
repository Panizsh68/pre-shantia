import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CartStatus } from '../enums/cart-status.enum';
import { CartItemSchema } from './cart-item.entity';
import { ICartItem } from '../interfaces/cart-item.interface';

@Schema({ timestamps: true })
export class Cart extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ type: [CartItemSchema], default: [] })
  items: ICartItem[];

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  totalAmount: number;

  @Prop({ type: String, default: 'IRR' })
  currency: string;

  @Prop({ type: String, enum: CartStatus, required: true, default: CartStatus.ACTIVE })
  status: CartStatus;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

// A user may have many historical carts, but only one cart can be active at
// a time. The old `unique: true` field option incorrectly blocked creation of
// a new active cart after checkout.
CartSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: CartStatus.ACTIVE },
    name: 'userId_active_unique',
  },
);
CartSchema.index({ userId: 1, status: 1 }, { name: 'userId_status_index' });
