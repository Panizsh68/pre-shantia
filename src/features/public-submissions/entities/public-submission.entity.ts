import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SellerType } from '../../companies/enums/seller-type.enum';
import { VendorRequestStatus } from '../enums/vendor-request-status.enum';

export enum PublicSubmissionType {
  Contact = 'contact',
  VendorRequest = 'vendor-request',
}

@Schema({ timestamps: true })
export class PublicSubmission extends Document {
  @Prop({ required: true, enum: Object.values(PublicSubmissionType) })
  type: PublicSubmissionType;

  @Prop({ required: true })
  email: string;

  @Prop({ type: String, index: true })
  userId?: string;

  @Prop()
  name?: string;

  @Prop()
  message?: string;

  @Prop()
  companyName?: string;

  @Prop({ enum: Object.values(SellerType), default: SellerType.LEGAL })
  sellerType?: SellerType;

  @Prop()
  phone?: string;

  @Prop()
  registrationNumber?: string;

  @Prop()
  nationalId?: string;

  @Prop()
  address?: string;

  @Prop()
  imageUrl?: string;

  @Prop({ enum: Object.values(VendorRequestStatus), default: VendorRequestStatus.PENDING, index: true })
  status?: VendorRequestStatus;

  @Prop({ type: String })
  reviewedBy?: string;

  @Prop({ type: Date })
  reviewedAt?: Date;

  @Prop({ type: String, maxlength: 500 })
  rejectionReason?: string;

  @Prop({ type: Types.ObjectId, ref: 'Company', index: true })
  companyId?: Types.ObjectId;
}

export const PublicSubmissionSchema = SchemaFactory.createForClass(PublicSubmission);
