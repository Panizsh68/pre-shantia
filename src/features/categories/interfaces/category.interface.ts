import { Types, Document } from 'mongoose';
import { CategoryStatus } from '../enums/category-status.enum';

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  parentId?: Types.ObjectId;
  companyId: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  status: CategoryStatus;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  children?: ICategory[];
}
