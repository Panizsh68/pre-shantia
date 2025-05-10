import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { QueryOptionsDto } from 'src/utils/query-options.dto';
import { Types } from 'mongoose';
import { ICategoryRepository } from './repositories/categories.repository';

export interface ICategoryService {
  create(createCategoryDto: CreateCategoryDto): Promise<Category>;
  findAll(options: QueryOptionsDto): Promise<Category[]>;
  findOne(id: string): Promise<Category>;
  update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category>;
  remove(id: string): Promise<boolean>;
}

@Injectable()
export class CategoriesService implements ICategoryService {
  constructor(@Inject('CategoryRepository') private readonly categoryRepository: ICategoryRepository) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const categoryData = {
      ...createCategoryDto,
      companyId: new Types.ObjectId(createCategoryDto.companyId),
      parentId: createCategoryDto.parentId ? new Types.ObjectId(createCategoryDto.parentId) : undefined,
    };
    return this.categoryRepository.create(categoryData);
  }

  async findAll(options: QueryOptionsDto): Promise<Category[]> {
    const queryOptions: QueryOptionsDto = {
      ...options,
      populate: ['companyId', 'parentId'],
    };
    return this.categoryRepository.findAll(queryOptions);
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne(id, ['companyId', 'parentId']);
    if (!category) {
      throw new NotFoundException(`دسته‌بندی با شناسه ${id} یافت نشد`);
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const updateData = {
      ...updateCategoryDto,
      companyId: updateCategoryDto.companyId ? new Types.ObjectId(updateCategoryDto.companyId) : undefined,
      parentId: updateCategoryDto.parentId ? new Types.ObjectId(updateCategoryDto.parentId) : undefined,
    };
    const updatedCategory = await this.categoryRepository.update(id, updateData);
    if (!updatedCategory) {
      throw new NotFoundException(`دسته‌بندی با شناسه ${id} یافت نشد`);
    }
    return updatedCategory;
  }

  async remove(id: string): Promise<boolean> {
    const removed = await this.categoryRepository.delete(id);
    if (!removed) {
      throw new NotFoundException(`دسته‌بندی با شناسه ${id} یافت نشد`);
    }
    return removed;
  }
}