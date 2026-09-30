import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BankAccountStatus } from '../enums/bank-account-status.enum';

@Schema({ timestamps: true })
export class BankAccount extends Document {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true, trim: true })
  accountHolderName: string;

  @Prop({ type: String, required: true, trim: true })
  cardNumber: string;

  @Prop({ type: String, required: true, uppercase: true, trim: true })
  iban: string;

  @Prop({ type: String, trim: true })
  bankName?: string;

  @Prop({ type: String, enum: BankAccountStatus, default: BankAccountStatus.PENDING, index: true })
  status: BankAccountStatus;

  @Prop({ type: String })
  rejectionReason?: string;

  @Prop({ type: String })
  reviewedBy?: string;

  @Prop({ type: Date })
  reviewedAt?: Date;
}

export const BankAccountSchema = SchemaFactory.createForClass(BankAccount);
BankAccountSchema.index({ userId: 1, iban: 1 }, { unique: true });
BankAccountSchema.index({ userId: 1, cardNumber: 1 }, { unique: true });
