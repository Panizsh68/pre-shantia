import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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

  @Prop({ default: true })
  isActive: boolean;
}

export const CompanySchema = SchemaFactory.createForClass(Company);