import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class ShahkarSetting {
  @Prop({ required: true, unique: true, default: 'registration' })
  key: string;

  @Prop({ required: true, default: false })
  enabled: boolean;
}

export const ShahkarSettingSchema = SchemaFactory.createForClass(ShahkarSetting);
