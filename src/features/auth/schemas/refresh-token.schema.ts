import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class RefreshToken extends Document {
  @Prop({ required: true })
  token: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ default: Date.now, expires: '7d' })
  createdAt: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
