import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IPermission } from 'src/features/permissions/interfaces/permissions.interface';

// Define the User schema using NestJS decorators
@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  @Prop({ required: true, unique: true })
  phoneNumber: string;

  @Prop({ required: true })
  nationalId: string;

  @Prop({
    type: [
      {
        resource: { type: String, required: true },
        actions: [{ type: String, required: true }],
        companyId: { type: String, required: false },
      },
    ],
    default: [],
  })
  permissions: IPermission[];
}

export const UserSchema = SchemaFactory.createForClass(User);
