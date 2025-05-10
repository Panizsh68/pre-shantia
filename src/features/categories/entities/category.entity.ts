import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, HydratedDocument, Types } from 'mongoose';
import { CategoryStatus } from '../enums/category-status.enum';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Category {

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
  status: CategoryStatus.DRAFT;

  @Prop()
  deletedAt?: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Compound indexes for performance
CategorySchema.index({ companyId: 1, status: 1 });
CategorySchema.index({ parentId: 1, slug: 1 });

// Soft delete plugin
CategorySchema.pre('find', function () {
  this.where({ deletedAt: null });
});
CategorySchema.pre('findOne', function () {
  this.where({ deletedAt: null });
});