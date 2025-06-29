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

  async create(data: Partial<Category>): Promise<ICategory> {
    return this.categoryRepository.createOne(data);
  }

  async findAll(companyId: string): Promise<Category[]> {
    return this.categoryRepository.findManyByCondition({
      companyId: new Types.ObjectId(companyId),
    });
  }

  async findOne(id: string): Promise<ICategory> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return category;
  }

  async update(id: string, updates: Partial<Category>): Promise<ICategory> {
    const updated = await this.categoryRepository.updateById(id, updates);
    if (!updated) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.categoryRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
  }

  async setStatus(id: string, status: CategoryStatus): Promise<ICategory> {
    return this.categoryRepository.updateOneByCondition({ id }, { status });
  }

  async findByParentId(parentId: string): Promise<ICategory[]> {
    return this.categoryRepository.findManyByCondition({ parentId: new Types.ObjectId(parentId) });
  }
}
