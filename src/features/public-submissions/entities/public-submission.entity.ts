import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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

  @Prop()
  name?: string;

  @Prop()
  message?: string;

  @Prop()
  companyName?: string;

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
}

export const PublicSubmissionSchema = SchemaFactory.createForClass(PublicSubmission);
