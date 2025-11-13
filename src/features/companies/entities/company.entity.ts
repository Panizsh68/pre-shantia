import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Company extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  address: string;

  @Prop()
  phone: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  registrationNumber: string;

  @Prop({ enum: ['pending', 'active', 'suspended', 'rejected'], default: 'pending' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  updatedBy: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  admins?: Types.ObjectId[];

  @Prop()
  nationalId?: string;

  @Prop()
  image?: string; // URL to company logo/image (presigned or public URL)
}

export const CompanySchema = SchemaFactory.createForClass(Company);
