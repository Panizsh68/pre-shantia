import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ICategoryRepository } from './repositories/categories.repository';
import { Category } from './entities/category.entity';
import { CategoryStatus } from './enums/category-status.enum';
import { Types } from 'mongoose';
import { ICategoryService } from './interfaces/category.service.interface';
import { ICategory } from './interfaces/category.interface';
import { FindManyOptions } from 'src/libs/repository/interfaces/base-repo-options.interface';
import { RequestContext } from 'src/common/types/request-context.interface';

@Injectable()
export class CategoriesService implements ICategoryService {
  constructor(
    @Inject('CategoryRepository') private readonly categoryRepository: ICategoryRepository,
  ) { }

  async create(data: Partial<Category>, userId: string, ctx: RequestContext): Promise<ICategory> {
    return this.categoryRepository.createOne({
      ...data,
      companyId: new Types.ObjectId(userId),
      createdBy: new Types.ObjectId(userId),
      updatedBy: new Types.ObjectId(userId),
    });
  }

  async findAll(options: FindManyOptions = {}): Promise<Category[]> {
    return this.categoryRepository.findAll({
      ...options,
      populate: options.populate || ['companyId', 'parentId'],
    });
  }

  async findOne(id: string): Promise<ICategory> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return category;
  }

  async update(id: string, updates: Partial<Category>, userId: string): Promise<ICategory> {
    const updated = await this.categoryRepository.updateOneByCondition(
      { _id: id, userId: new Types.ObjectId(userId) },
      updates,
    );
    if (!updated) {
      throw new NotFoundException(`Category with id ${id} not found or access denied`);
    }
    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const deleted = await this.categoryRepository.updateOneByCondition(
      { _id: id, userId: new Types.ObjectId(userId) },
      { deletedAt: new Date() },
    );
    if (!deleted) {
      throw new NotFoundException(`Category with id ${id} not found or access denied`);
    }
  }

  async setStatus(id: string, status: CategoryStatus, userId: string): Promise<ICategory> {
    return this.categoryRepository.updateOneByCondition(
      { _id: id, userId: new Types.ObjectId(userId) },
      { status },
    );
  }

  async findByParentId(parentId: string, options: FindManyOptions = {}): Promise<ICategory[]> {
    return this.categoryRepository.findAll({
      ...options,
      conditions: {
        ...options.conditions,
        parentId: new Types.ObjectId(parentId),
      },
      populate: options.populate || ['companyId', 'parentId'],
    });
  }

  async existsBySlug(slug: string): Promise<boolean> {
    return this.categoryRepository.existsByCondition({ slug });
  }

  async count(): Promise<number> {
    return this.categoryRepository.countByCondition({});
  }
}
