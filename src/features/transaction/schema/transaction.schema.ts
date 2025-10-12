import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TransactionStatus } from '../enums/transaction.status.enum';
import { RefundStatus } from '../enums/refund.status.enum';
import { TransactionType } from '../enums/transaction.type.enum';

@Schema({ timestamps: true })
export class Transaction extends Document {
  // Zibal trackId: optional at create time, filled when SDK returns it
  @Prop({ required: false, unique: true, sparse: true })
  trackId?: string;

  // Local internal id used for correlation inside our system (UUID)
  @Prop({ required: true, unique: true })
  localId: string;

  @Prop({ required: true })
  amount: number;

  @Prop()
  description?: string;

  @Prop()
  mobile?: string;

  @Prop()
  email?: string;

  // orderId is optional now so the transaction entity can be reused for
  // wallet-related transactions which are not tied to an Order.
  @Prop({ type: String, ref: 'Order', required: false })
  orderId?: string;

  @Prop({ type: String, enum: TransactionType })
  type?: TransactionType;

  @Prop({ type: String })
  currency?: string;

  @Prop({ type: String })
  ticketId?: string;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ required: true, enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Prop({ enum: RefundStatus })
  refund_status?: RefundStatus;

  @Prop()
  verifiedAt?: Date;

  @Prop()
  ref_id?: string;

  @Prop()
  refund_id?: string;

  @Prop()
  refund_amount?: number;

  @Prop()
  refund_reason?: string;

  @Prop()
  refundedAt?: Date;

  // wallet-related optional fields for richer auditing
  @Prop({ type: String })
  fromWalletId?: string;

  @Prop({ type: String })
  toWalletId?: string;

  @Prop({ type: String })
  counterpartyOwnerId?: string;

  @Prop({ type: String })
  counterpartyOwnerType?: string;

  @Prop({ type: Number })
  resultingBalance?: number;

  @Prop({ type: Number })
  resultingBalanceTo?: number;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;

  @Prop()
  correlationId?: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Indexes for fast lookup
TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ localId: 1 });
