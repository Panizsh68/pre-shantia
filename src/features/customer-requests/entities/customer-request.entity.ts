import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CustomerRequestStatus } from '../enums/customer-request-status.enum';
import { CustomerRequestType } from '../enums/customer-request-type.enum';

@Schema({ timestamps: true })
export class CustomerRequest extends Document {
  @Prop({ required: true, enum: Object.values(CustomerRequestType), index: true })
  type: CustomerRequestType;

  @Prop({ type: String, index: true })
  userId?: string;

  @Prop({ required: true, trim: true, maxlength: 160 })
  title: string;

  @Prop({ trim: true, maxlength: 120 })
  productName?: string;

  @Prop({ type: String, index: true })
  productId?: string;

  @Prop({ type: Number, min: 1 })
  quantity?: number;

  @Prop({ trim: true, maxlength: 80 })
  unit?: string;

  @Prop({ trim: true, maxlength: 240 })
  deliveryLocation?: string;

  @Prop({ required: true, trim: true, maxlength: 4000 })
  description: string;

  @Prop({ trim: true, maxlength: 160 })
  reporterName?: string;

  @Prop({ trim: true, lowercase: true, maxlength: 254 })
  reporterEmail?: string;

  @Prop({ trim: true, maxlength: 30 })
  reporterPhone?: string;

  @Prop({ trim: true, maxlength: 2048 })
  targetUrl?: string;

  @Prop({ trim: true, maxlength: 120 })
  targetReference?: string;

  @Prop({ enum: Object.values(CustomerRequestStatus), default: CustomerRequestStatus.PENDING, index: true })
  status: CustomerRequestStatus;

  @Prop({ trim: true, maxlength: 4000 })
  adminResponse?: string;

  @Prop({ type: Number, min: 0 })
  quotedAmount?: number;

  @Prop({ trim: true, maxlength: 20, default: 'ریال' })
  currency?: string;

  @Prop({ type: String })
  reviewedBy?: string;

  @Prop({ type: Date })
  reviewedAt?: Date;
}

export const CustomerRequestSchema = SchemaFactory.createForClass(CustomerRequest);
CustomerRequestSchema.index({ userId: 1, type: 1, createdAt: -1 });
CustomerRequestSchema.index({ type: 1, status: 1, createdAt: -1 });
