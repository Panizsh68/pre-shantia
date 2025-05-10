// src/transactions/schemas/transaction.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TransactionType } from '../enums/transaction-type.enum';
import { TransactionStatus } from '../enums/transaction.status.enum';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Transaction {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  paymentId?: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ enum: TransactionType })
  type: TransactionType;

  @Prop({ enum: TransactionStatus })
  status: TransactionStatus;

  _id: Types.ObjectId;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Indexes
TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ paymentId: 1 });

// Sharding: Configure at MongoDB level with shard key: { createdAt: 1 }