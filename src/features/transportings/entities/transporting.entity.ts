import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TransportingStatus } from '../enums/transporting.status.enum';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Transporting extends Document {
  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  companyId: string;

  @Prop({ required: true })
  status: TransportingStatus;

  @Prop()
  estimatedDelivery: Date;
}

export const TransportingSchema = SchemaFactory.createForClass(Transporting);
