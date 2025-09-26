import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Cart, CartSchema } from 'src/features/carts/entities/cart.entity';

@Schema()
export class Profile extends Document {
  @Prop({ type: String, ref: 'User', required: true, unique: true })
  userId: string;

  @Prop({ type: String, required: true, default: 'نام' })
  firstName?: string;

  @Prop({ type: String, required: true, default: 'نام‌خانوادگی' })
  lastName?: string;

  @Prop({ type: String, required: true, default: 'test@example.com' })
  email?: string;

  @Prop({ type: String, required: true })
  phoneNumber: string;

  @Prop({ type: String, required: true, default: 'نامشخص' })
  address?: string;

  @Prop({ type: String, required: true })
  nationalId: string;

  @Prop({ type: String, ref: 'Wallet' })
  walletId?: string;

  @Prop({ type: [{ type: String, ref: 'Order' }], default: [] })
  orders: string[];

  @Prop({ type: [{ type: String, ref: 'Transaction' }], default: [] })
  transactions: string[];

  @Prop({ type: [{ type: String, ref: 'Product' }], default: [] })
  favorites: string[];

  @Prop({ type: String, ref: 'Cart' })
  cart: string;
}
export const ProfileSchema = SchemaFactory.createForClass(Profile);
