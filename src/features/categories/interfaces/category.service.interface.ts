import { Category } from '../entities/category.entity';
import { CategoryStatus } from '../enums/category-status.enum';
import { ICategory } from './category.interface';

export interface ICategoryService {
  create(data: Partial<Category>): Promise<ICategory>;
  findAll(companyId: string): Promise<ICategory[]>;
  findOne(id: string): Promise<ICategory>;
  update(id: string, updates: Partial<Category>): Promise<ICategory>;
  remove(id: string): Promise<void>;
  setStatus(id: string, status: CategoryStatus): Promise<ICategory>;
  findByParentId(parentId: string): Promise<ICategory[]>;
}
