import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ICategoryRepository } from './repositories/categories.repository';

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

  async create(data: Partial<ICategory>, userId: string, ctx: RequestContext): Promise<ICategory> {
    // Sanitize parentId: اگر رشته خالی یا نامعتبر بود، undefined شود
    let sanitizedData = { ...data };
    if (
      (typeof sanitizedData.parentId === 'string' && (sanitizedData.parentId + '').trim() === '')
      || sanitizedData.parentId === null
      || (typeof sanitizedData.parentId === 'string' && !Types.ObjectId.isValid(sanitizedData.parentId))
    ) {
      sanitizedData.parentId = undefined;
    }
    return this.categoryRepository.createOne({
      ...sanitizedData,
      companyId: userId ? new Types.ObjectId(userId) : undefined,
      createdBy: userId ? new Types.ObjectId(userId) : undefined,
      updatedBy: userId ? new Types.ObjectId(userId) : undefined,
    });
  }

  async findAll(options: FindManyOptions = {}): Promise<ICategory[]> {
    // تضمین اینکه conditions یک آبجکت باشد
    const conditions = options.conditions && typeof options.conditions === 'object' ? { ...options.conditions } : {};

    // حذف شرط‌های نامعتبر
    if (conditions._id === undefined || conditions._id === null || conditions._id === '') {
      delete conditions._id;
    }

    if (conditions.parentId === undefined || conditions.parentId === null || conditions.parentId === '') {
      delete conditions.parentId;
    }

    // جلوگیری از populate های غیرضروری
    const sanitizedOptions: FindManyOptions = {
      ...options,
      conditions,
      // فقط در صورتی که شرط‌های جستجو وجود داشته باشند populate انجام شود
      populate: Object.keys(conditions).length > 0 ? ['companyId', 'parentId'] : undefined
    };

    console.log('findAll service - sanitized options:', sanitizedOptions);

    return this.categoryRepository.findAll(sanitizedOptions);
  }

  async findOne(id: string): Promise<ICategory> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return category;
  }

  async update(id: string, updates: Partial<ICategory>, userId: string): Promise<ICategory> {
    // Defensive: sanitize id
    let sanitizedId = (typeof id === 'string' && Types.ObjectId.isValid(id)) ? id : undefined;
    if (!sanitizedId) {
      throw new BadRequestException('Invalid category ID');
    }

    // اول دسته‌بندی را پیدا می‌کنیم
    const category = await this.categoryRepository.findById(sanitizedId);
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    // بررسی دسترسی بر اساس companyId
    if (category.companyId?.toString() !== userId) {
      throw new NotFoundException('Category not found or access denied');
    }

    // Sanitize parentId in updates
    let sanitizedUpdates = { ...updates };
    if (
      (typeof sanitizedUpdates.parentId === 'string' && (sanitizedUpdates.parentId + '').trim() === '')
      || sanitizedUpdates.parentId === null
      || (typeof sanitizedUpdates.parentId === 'string' && !Types.ObjectId.isValid(sanitizedUpdates.parentId))
    ) {
      sanitizedUpdates.parentId = undefined;
    }

    // اضافه کردن updatedBy
    sanitizedUpdates.updatedBy = new Types.ObjectId(userId);

    return this.categoryRepository.updateOneByCondition(
      { _id: new Types.ObjectId(sanitizedId) },
      sanitizedUpdates,
    );
  }

  async remove(id: string, userId: string): Promise<void> {
    // Defensive: sanitize id
    let sanitizedId = (typeof id === 'string' && Types.ObjectId.isValid(id)) ? id : undefined;
    if (!sanitizedId) {
      throw new BadRequestException('Invalid category ID');
    }

    // اول دسته‌بندی را پیدا می‌کنیم
    const category = await this.categoryRepository.findById(sanitizedId);
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    // بررسی دسترسی بر اساس companyId
    if (category.companyId?.toString() !== userId) {
      throw new NotFoundException('Category not found or access denied');
    }

    const deleted = await this.categoryRepository.updateOneByCondition(
      { _id: new Types.ObjectId(sanitizedId) },
      { 
        deletedAt: new Date(),
        updatedBy: new Types.ObjectId(userId)
      },
    );

    if (!deleted) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
  }

  async setStatus(id: string, status: CategoryStatus, userId: string): Promise<ICategory> {
    // Defensive: sanitize id
    let sanitizedId = (typeof id === 'string' && Types.ObjectId.isValid(id)) ? id : undefined;
    if (!sanitizedId) {
      throw new BadRequestException('Invalid category ID');
    }

    // اول دسته‌بندی را پیدا می‌کنیم
    const category = await this.categoryRepository.findById(sanitizedId);
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    // بررسی دسترسی بر اساس companyId
    if (category.companyId?.toString() !== userId) {
      throw new NotFoundException('Category not found or access denied');
    }

    return this.categoryRepository.updateOneByCondition(
      { _id: new Types.ObjectId(sanitizedId) },
      { 
        status,
        updatedBy: new Types.ObjectId(userId)
      },
    );
  }

  async findByParentId(parentId: string, options: FindManyOptions = {}): Promise<ICategory[]> {
    const conditions = { ...options.conditions };
    if (
      parentId &&
      typeof parentId === 'string' &&
      Types.ObjectId.isValid(parentId)
    ) {
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
