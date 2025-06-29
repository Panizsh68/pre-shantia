import { Types } from 'mongoose';
import { CategoryStatus } from '../enums/category-status.enum';

export interface ICategory {
  name: string;
  slug: string;
  description?: string;
  parentId?: Types.ObjectId;
  companyId: Types.ObjectId;
  status: CategoryStatus;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
