import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Rating extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Number, min: 1, max: 5, required: true })
  rating: number;

  @Prop({ type: String })
  comment?: string;
}

export const RatingSchema = SchemaFactory.createForClass(Rating);
// Ensure one rating per user per product and index for product lookups
RatingSchema.index({ productId: 1, userId: 1 }, { unique: true });
RatingSchema.index({ productId: 1 });
