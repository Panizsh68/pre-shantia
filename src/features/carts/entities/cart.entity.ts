import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CartStatus } from '../enums/cart-status.enum';
import { CartItemSchema } from './cart-item.entity';
import { ICartItem } from '../interfaces/cart-item.interface';

@Schema({ timestamps: true })
export class Cart extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: string;

  @Prop({ type: [CartItemSchema], default: [] })
  items: ICartItem[];

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  totalAmount: number;

  @Prop({ type: String, enum: CartStatus, required: true, default: CartStatus.ACTIVE })
  status: CartStatus;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
