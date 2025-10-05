import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Cart, CartSchema } from 'src/features/carts/entities/cart.entity';

@Schema()
export class Profile extends Document {
  @Prop({ type: String, ref: 'User', required: true, unique: true })
  userId: string;

  @Prop({ type: String, required: false, default: '' })
  firstName?: string;

  @Prop({ type: String, required: false, default: '' })
  lastName?: string;

  @Prop({ type: String, required: false, default: '' })
  email?: string;

  @Prop({ type: String, required: true })
  phoneNumber: string;

  @Prop({ type: String, required: false, default: '' })
  address?: string;

  @Prop({ type: String, required: true })
  nationalId: string;

  @Prop({ type: String, ref: 'Wallet' })
  walletId?: string;

  @Prop({ type: Types.ObjectId, ref: 'Company', index: true })
  companyId?: Types.ObjectId;

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
