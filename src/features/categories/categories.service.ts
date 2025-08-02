import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ICategoryRepository } from './repositories/categories.repository';
import { Category } from './entities/category.entity';
import { CategoryStatus } from './enums/category-status.enum';
import { Types } from 'mongoose';
import { ICategoryService } from './interfaces/category.service.interface';
import { ICategory } from './interfaces/category.interface';

@Injectable()
export class CategoriesService implements ICategoryService {
  constructor(
    @Inject('CategoryRepository') private readonly categoryRepository: ICategoryRepository,
  ) {}

  async create(data: Partial<Category>, userId: string): Promise<ICategory> {
    return this.categoryRepository.createOne({ ...data, companyId: new Types.ObjectId(userId) });
  }

  async findAll(userId: string): Promise<Category[]> {
    return this.categoryRepository.findManyByCondition({
      userId: new Types.ObjectId(userId),
    });
  }

  async findOne(id: string, userId: string): Promise<ICategory> {
    const category = await this.categoryRepository.findOneByCondition({
      _id: id,
      userId: new Types.ObjectId(userId),
    });
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found or access denied`);
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

  async findByParentId(parentId: string, userId: string): Promise<ICategory[]> {
    return this.categoryRepository.findManyByCondition({
      parentId: new Types.ObjectId(parentId),
      userId: new Types.ObjectId(userId),
    });
  }
}
