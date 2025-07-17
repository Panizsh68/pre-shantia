import { Category } from '../entities/category.entity';
import { CategoryStatus } from '../enums/category-status.enum';
import { ICategory } from './category.interface';

export interface ICategoryService {
  create(data: Partial<Category>, userId: string): Promise<ICategory>;
  findAll(userId: string): Promise<ICategory[]>;
  findOne(id: string, userId: string): Promise<ICategory>;
  update(id: string, updates: Partial<Category>, userId: string): Promise<ICategory>;
  remove(id: string, userId: string): Promise<void>;
  setStatus(id: string, status: CategoryStatus, userId: string): Promise<ICategory>;
  findByParentId(parentId: string, userId: string): Promise<ICategory[]>;
}
