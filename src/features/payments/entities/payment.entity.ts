// src/payments/schemas/payment.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PaymentType } from '../enums/payment-type.enum';
import { PaymentMethod } from '../enums/payment-method.enum';

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, unique: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 0 })
  amount: number;

  @Prop({
    type: String,
    enum: PaymentType,
    required: true,
    default: PaymentType.PENDING,
  })
  status: string;

  @Prop({ type: String, enum: PaymentMethod, required: true })
  method: string;

  @Prop({ type: String })
  externalPaymentId: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Indexes
PaymentSchema.index({ orderId: 1 }, { unique: true });
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ companyId: 1 });
PaymentSchema.index({ createdAt: 1 });

// Sharding: Configure at MongoDB level with shard key: { orderId: "hashed" }                                                        