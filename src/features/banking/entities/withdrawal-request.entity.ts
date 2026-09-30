import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { WithdrawalStatus } from '../enums/withdrawal-status.enum';

@Schema({ timestamps: true })
export class WithdrawalRequest extends Document {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true, index: true })
  bankAccountId: string;

  @Prop({ type: Number, required: true, min: 1 })
  amount: number;

  @Prop({ type: String, required: true, default: 'IRR' })
  currency: string;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({ type: String, enum: WithdrawalStatus, default: WithdrawalStatus.PENDING, index: true })
  status: WithdrawalStatus;

  @Prop({ type: String, unique: true, required: true })
  correlationId: string;

  @Prop({ type: String })
  rejectionReason?: string;

  @Prop({ type: String })
  reviewedBy?: string;

  @Prop({ type: Date })
  reviewedAt?: Date;

  @Prop({ type: Date })
  paidAt?: Date;
}

export const WithdrawalRequestSchema = SchemaFactory.createForClass(WithdrawalRequest);
WithdrawalRequestSchema.index({ userId: 1, createdAt: -1 });
WithdrawalRequestSchema.index({ status: 1, createdAt: -1 });
