// src/transactions/schemas/transaction.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TransactionType } from '../enums/transaction-type.enum';
import { TransactionStatus } from '../enums/transaction.status.enum';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'Payment', required: true })
  paymentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  sourceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  destinationId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, enum: TransactionType, required: true })
  type: string;

  @Prop({ type: String, enum: TransactionStatus, required: true, default: 'completed' })
  status: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Indexes
TransactionSchema.index({ paymentId: 1 });
TransactionSchema.index({ orderId: 1 });
TransactionSchema.index({ sourceId: 1 });
TransactionSchema.index({ destinationId: 1 });
TransactionSchema.index({ createdAt: 1 });

// Sharding: Configure at MongoDB level with shard key: { createdAt: 1 }