// src/payments/schemas/payment.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentGateway } from '../enums/payment-gateway.enum';
import { PaymentStatus } from '../enums/payment-status.enum';

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, unique: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 0 })
  amount: number;

  @Prop({
    type: String,
    enum: PaymentStatus,
    required: true,
    default: PaymentStatus.PENDING,
  })
  status: string;

  @Prop({ required: true })
  currency: string;

  @Prop({ type: String, enum: PaymentMethod, required: true })
  method: string;

  @Prop({ enum: PaymentGateway })
  gateway: PaymentGateway;

  @Prop()
  gatewayTransactionId?: string;

  _id: mongoose.Types.ObjectId
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Indexes
PaymentSchema.index({ orderId: 1 }, { unique: true });
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ companyId: 1 });
PaymentSchema.index({ createdAt: 1 });

// Sharding: Configure at MongoDB level with shard key: { orderId: "hashed" }                                                        