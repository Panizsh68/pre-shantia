import {
  Model,
  Document,
  FilterQuery,
  UpdateQuery,
  Types,
  ClientSession,
  Query,
  PopulateOptions,
} from 'mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  FindOptions,
  FindManyOptions,
  UpdateOptions,
  SortOrder,
} from '../interfaces/base-repo-options.interface';
import { IBaseCrudRepository } from '../interfaces/base-repo.interfaces';

export class BaseCrudRepository<T extends Document> implements IBaseCrudRepository<T> {
  constructor(protected readonly model: Model<T>) {
    if (!model) {
      throw new Error('Model instance is required');
    }
  }

  async createOne(data: Partial<T>, session?: ClientSession): Promise<T> {
    return this.handleOperation(
      () => this.model.create([data], { session }).then(docs => docs[0]),
      'Failed to create document',
    );
  }

  async saveOne(document: T, session?: ClientSession): Promise<T> {
    return this.handleOperation(async () => {
      if (!(document instanceof this.model)) {
        throw new BadRequestException('Invalid document instance');
      }
      const savedDoc = await document.save({ session });
      return savedDoc;
    }, 'Failed to save document');
  }

  async findById(
    id: string,
    options: FindOptions & { session?: ClientSession } = {},
  ): Promise<T | null> {
    this.ensureValidObjectId(id);
    return this.findOne(() =>
      this.applyQueryOptions(this.model.findById(id), options).session(options.session ?? null),
    );
  }

  async findOneByCondition(
    condition: FilterQuery<T>,
    options: FindOptions & { session?: ClientSession } = {},
  ): Promise<T | null> {
    return this.findOne(() =>
      this.applyQueryOptions(this.model.findOne(condition), options).session(
        options.session ?? null,
      ),
    );
  }

  async findManyByCondition(
    condition: FilterQuery<T>,
    options: FindManyOptions & { session?: ClientSession } = {},
  ): Promise<T[]> {
    // ساخت یک کپی از شرایط جستجو با تایپ صحیح
    const sanitizedCondition = {} as FilterQuery<T>;

    // فقط فیلدهای معتبر را اضافه می‌کنیم
    if (condition && typeof condition === 'object') {
      Object.keys(condition).forEach((key) => {
        const value = condition[key];
        // فقط مقادیر معنی‌دار را اضافه می‌کنیم
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'string' &&
            ['_id', 'parentId', 'companyId'].includes(key) &&
            Types.ObjectId.isValid(value)) {
            // تبدیل به ObjectId
            (sanitizedCondition as any)[key] = new Types.ObjectId(value);
          } else {
            // استفاده مستقیم از مقدار
            (sanitizedCondition as any)[key] = value;
          }
        }
      });
    }

    console.log('findManyByCondition - original condition:', condition);
    console.log('findManyByCondition - sanitized condition:', sanitizedCondition);

    return this.handleOperation(
      () =>
        this.applyQueryOptions(this.model.find(sanitizedCondition), options)
          .session(options.session ?? null)
          .exec(),
      'Failed to find documents',
    );
  }

  async findAll(options: FindManyOptions & { session?: ClientSession } = {}): Promise<T[]> {
    // Pass options.conditions to respect filters and avoid ObjectId cast errors
    return this.findManyByCondition(options.conditions ?? {}, options);
  }

  async updateById(id: string, data: UpdateQuery<T>, session?: ClientSession): Promise<T> {
    this.ensureValidObjectId(id);
    return this.updateOne(
      () => this.model.findByIdAndUpdate(id, data, { new: true }).session(session ?? null),
      `Document with ID ${id} not found`,
    );
  }

  async updateOneByCondition(
    condition: FilterQuery<T>,
    data: UpdateQuery<T>,
    options: UpdateOptions & { session?: ClientSession } = {},
  ): Promise<T> {
    return this.updateOne(
      () =>
        this.model
          .findOneAndUpdate(condition, data, { new: true, ...options })
          .session(options.session ?? null),
      'Document matching condition not found',
    );
  }

  async deleteById(id: string, session?: ClientSession): Promise<boolean> {
    this.ensureValidObjectId(id);
    return this.deleteOne(
      () => this.model.findByIdAndDelete(id).session(session ?? null),
      `Document with ID ${id} not found`,
    );
  }

  async countByCondition(condition: FilterQuery<T>, session?: ClientSession): Promise<number> {
    return this.handleOperation(
      () =>
        this.model
          .countDocuments(condition)
          .session(session ?? null)
          .exec(),
      'Failed to count documents',
    );
  }

  async existsByCondition(condition: FilterQuery<T>, session?: ClientSession): Promise<boolean> {
    return this.handleOperation(
      async () => !!(await this.model.exists(condition).session(session ?? null)),
      'Failed to check existence',
    );
  }

  protected applyQueryOptions<R = Partial<T>>(
    query: Query<R, T, {}, T>,
    options: FindManyOptions = {},
  ): Query<R, T, {}, T> {
    if (options.select) {
      query.select(options.select);
    }

    if (options.populate) {
      query.populate(options.populate as PopulateOptions | (string | PopulateOptions)[]);
    }

    if (options.page !== undefined || options.perPage !== undefined) {
      const page = Math.max(1, options.page ?? 1);
      const perPage = Math.max(1, options.perPage ?? 10);
      query.skip((page - 1) * perPage).limit(perPage);
    }

    if (options.sort?.length) {
      const sortObj: Record<string, 1 | -1> = Object.fromEntries(
        options.sort.map(({ field, order }) => [field, order === SortOrder.ASC ? 1 : -1]),
      );
      query.sort(sortObj);
    }

    return query;
  }

  private async handleOperation<R>(operation: () => Promise<R>, errorMessage: string): Promise<R> {
    try {
      return await operation();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new BadRequestException(`${errorMessage}: ${message}`);
    }
  }

  private async findOne(fn: () => Promise<T | null>): Promise<T | null> {
    const result = await fn();
    return result;
  }

  private async updateOne(fn: () => Promise<T | null>, notFoundMessage: string): Promise<T> {
    const result = await this.handleOperation(fn, 'Failed to update document');
    if (!result) {
      throw new NotFoundException(notFoundMessage);
    }
    return result;
  }

  private async deleteOne(fn: () => Promise<T | null>, notFoundMessage: string): Promise<boolean> {
    const result = await this.handleOperation(fn, 'Failed to delete document');
    this.ensureExists(result, notFoundMessage);
    return true;
  }

  private ensureExists(document: T | null, message: string): void {
    if (!document) {
      throw new NotFoundException(message);
    }
  }

  private ensureValidObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ID format');
    }
  }
}
