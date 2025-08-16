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
      companyId: userId ? new Types.ObjectId(userId) : undefined,
      createdBy: userId ? new Types.ObjectId(userId) : undefined,
      updatedBy: userId ? new Types.ObjectId(userId) : undefined,
    });
  }

  async findAll(options: FindManyOptions = {}): Promise<Category[]> {
    // Defensive: ensure conditions is always an object
    let conditions = options.conditions && typeof options.conditions === 'object' ? { ...options.conditions } : {};
    // Remove any invalid _id
    if (
      conditions._id && (
        typeof conditions._id !== 'string' ||
        !Types.ObjectId.isValid(conditions._id)
      )
    ) {
      delete conditions._id;
    }
    return this.categoryRepository.findAll({
      ...options,
      conditions,
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
    const condition: any = { _id: id };
    if (userId) condition.userId = new Types.ObjectId(userId);
    const updated = await this.categoryRepository.updateOneByCondition(
      condition,
      updates,
    );
    if (!updated) {
      throw new NotFoundException(`Category with id ${id} not found or access denied`);
    }
    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const condition: any = { _id: id };
    if (userId) condition.userId = new Types.ObjectId(userId);
    const deleted = await this.categoryRepository.updateOneByCondition(
      condition,
      { deletedAt: new Date() },
    );
    if (!deleted) {
      throw new NotFoundException(`Category with id ${id} not found or access denied`);
    }
  }

  async setStatus(id: string, status: CategoryStatus, userId: string): Promise<ICategory> {
    const condition: any = { _id: id };
    if (userId) condition.userId = new Types.ObjectId(userId);
    return this.categoryRepository.updateOneByCondition(
      condition,
      { status },
    );
  }

  async findByParentId(parentId: string, options: FindManyOptions = {}): Promise<ICategory[]> {
    const conditions = { ...options.conditions };
    if (parentId) {
      conditions.parentId = new Types.ObjectId(parentId);
    } else {
      delete conditions.parentId;
    }
    return this.categoryRepository.findAll({
      ...options,
      conditions,
      populate: options.populate || ['parentId'],
    });
  }

  async existsBySlug(slug: string): Promise<boolean> {
    return this.categoryRepository.existsByCondition({ slug });
  }

  async count(): Promise<number> {
    return this.categoryRepository.countByCondition({});
  }
}
