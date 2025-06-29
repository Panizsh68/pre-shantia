import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CategoryStatus } from '../enums/category-status.enum';

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Category extends Document {
  @Prop({ required: true, index: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', index: true })
  parentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, index: true })
  companyId: Types.ObjectId;

  @Prop({
    type: String,
    enum: CategoryStatus,
    default: CategoryStatus.DRAFT,
    index: true,
  })
  status: CategoryStatus;

  @Prop()
  deletedAt?: Date;

  // Virtual property to retrieve children categories
  children?: Category[];
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Add virtuals for hierarchical relationships
CategorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId',
});

// Add pre-save hook for soft deletion
CategorySchema.pre('save', function (next) {
  if (this.deletedAt) {
    this.status = CategoryStatus.INACTIVE;
  }
  next();
});
