import { Category } from '../entities/category.entity';
import { CategoryStatus } from '../enums/category-status.enum';
import { ICategory } from './category.interface';
import { FindManyOptions } from 'src/libs/repository/interfaces/base-repo-options.interface';
import { RequestContext } from 'src/common/types/request-context.interface';

export interface ICategoryService {
  create(data: Partial<Category>, userId: string, ctx: RequestContext): Promise<ICategory>;
  findAll(options?: FindManyOptions): Promise<ICategory[]>;
  findOne(id: string): Promise<ICategory>;
  update(id: string, updates: Partial<Category>, userId: string): Promise<ICategory>;
  remove(id: string, userId: string): Promise<void>;
  setStatus(id: string, status: CategoryStatus, userId: string): Promise<ICategory>;
  findByParentId(parentId: string, options?: FindManyOptions): Promise<ICategory[]>;
  existsBySlug(slug: string): Promise<boolean>;
  count(): Promise<number>;
}
