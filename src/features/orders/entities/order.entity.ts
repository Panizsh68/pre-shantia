import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { OrdersStatus } from '../enums/orders.status.enum';
import { Document } from 'mongoose';
import OrderItemSchema from './order-item.entity';
import { IOrderItem } from '../interfaces/order-item.interface';

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ type: [OrderItemSchema], required: true, default: [] })
  items: IOrderItem[];

  @Prop({ required: true })
  totalPrice: number;

  @Prop({ default: OrdersStatus.PENDING })
  status: OrdersStatus;

  @Prop()
  shippingAddress: string;

  @Prop()
  paymentMethod: string;

  @Prop({ required: true })
  companyId: string;

  @Prop()
  transportId: string;

  @Prop({ type: String, index: true, default: null })
  ticketId: string | null;

  @Prop({ type: Date, index: true, default: null })
  deliveredAt?: Date | null;

  @Prop({ type: Date, index: true, default: null })
  confirmedAt?: Date | null;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

