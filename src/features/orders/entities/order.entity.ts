import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';
import { OrdersStatus } from '../enums/orders.status.enum';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true })
  userId: string; 

  @Prop({ required: true, type: [{ productId: String, quantity: Number }] })
  items: { productId: string; quantity: number }[];

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
}

export const OrderSchema = SchemaFactory.createForClass(Order);
