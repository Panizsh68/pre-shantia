import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TransactionStatus } from '../enums/transaction.status.enum';
import { RefundStatus } from '../enums/refund.status.enum';

@Schema({ timestamps: true })
export class Transaction extends Document {
  @Prop({ required: true, unique: true })
  authority: string;

  @Prop({ required: true })
  amount: number;

  @Prop()
  description?: string;

  @Prop()
  mobile?: string;

  @Prop()
  email?: string;

  @Prop({ required: true, type: String, ref: 'Order' })
  orderId: string;

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
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
