import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Define the User schema using NestJS decorators
@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  nationalId: string;

  @Prop({ type: [String], ref: 'Role', default: [] })
  roles: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
