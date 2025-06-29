import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Resource } from '../enums/resources.enum';
import { Action } from '../enums/actions.enum';
import { Document } from 'mongoose';

@Schema()
class Permission {
  @Prop({ required: true, enum: Resource })
  resource: Resource;

  @Prop({ type: [{ type: String, enum: Action }] })
  actions: Action[];
}

@Schema()
export class Role extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, type: [Permission] })
  permissions: Permission[];
}

export const RoleSchema = SchemaFactory.createForClass(Role);
