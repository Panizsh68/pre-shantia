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
import { toMongooseSession } from '../session-utils';

// Generic Base Repository for common CRUD operations
export class BaseCrudRepository<T extends Document> implements IBaseCrudRepository<T> {
  constructor(protected readonly model: Model<T>) {
    // Ensure that a valid model instance is passed in
    if (!model) {
      throw new Error('Model instance is required');
    }
  }

  // Create a new document with optional transaction session
  async createOne(data: Partial<T>, session?: ClientSession): Promise<T> {
    return this.handleOperation(
      () => this.model.create([data], { session }).then(docs => docs[0]),
      'Failed to create document',
    );
  }

  // Save an existing document instance
  async saveOne(document: T, session?: ClientSession): Promise<T> {
    return this.handleOperation(async () => {
      // Don't rely on instanceof checks across model boundaries; assume caller provides a valid document
      const savedDoc = await document.save({ session });
      return savedDoc;
    }, 'Failed to save document');
  }

  // Find a document by ID
  async findById(
    id: string,
    options: FindOptions & { session?: ClientSession } = {},
  ): Promise<T | null> {
    this.ensureValidObjectId(id); // Validate ObjectId format
    return this.findOne(() =>
      this.applyQueryOptions(this.model.findById(id), options).session(toMongooseSession(options.session)),
    );
  }

  // Find one document by condition
  async findOneByCondition(
    condition: FilterQuery<T>,
    options: FindOptions & { session?: ClientSession } = {},
  ): Promise<T | null> {
    return this.findOne(() =>
      this.applyQueryOptions(this.model.findOne(condition), options).session(
        toMongooseSession(options.session),
      ),
    );
  }

  // Find multiple documents by condition
  async findManyByCondition(
    condition: FilterQuery<T>,
    options: FindManyOptions & { session?: ClientSession } = {},
  ): Promise<T[]> {
    const sanitizedCondition: Record<string, unknown> = {};

    // Sanitize the condition object
    if (condition && typeof condition === 'object') {
      Object.keys(condition).forEach((key) => {
        const value = condition[key];
        if (value !== undefined && value !== null && value !== '') {
          // Convert string IDs to ObjectId if valid
          if (typeof value === 'string' &&
            ['_id', 'parentId', 'companyId'].includes(key) &&
            Types.ObjectId.isValid(value)) {
            sanitizedCondition[key] = new Types.ObjectId(value);
          } else {
            sanitizedCondition[key] = value;
          }
        }
      });
    }

    // Debug logs for conditions
    console.log('findManyByCondition - original condition:', condition);
    console.log('findManyByCondition - sanitized condition:', sanitizedCondition);

    return this.handleOperation(
      () =>
        this.applyQueryOptions(this.model.find(sanitizedCondition as FilterQuery<T>), options)
          .session(toMongooseSession(options.session))
          .exec(),
      'Failed to find documents',
    );
  }

  // Find all documents (with optional filters)
  async findAll(options: FindManyOptions & { session?: ClientSession } = {}): Promise<T[]> {
    return this.findManyByCondition(options.conditions ?? {}, options);
  }

  // Update document by ID
  async updateById(id: string, data: UpdateQuery<T>, session?: ClientSession): Promise<T> {
    this.ensureValidObjectId(id); // Validate ObjectId
    return this.updateOne(
      () => this.model.findByIdAndUpdate(id, data, { new: true }).session(toMongooseSession(session)),
      `Document with ID ${id} not found`,
    );
  }

  // Update one document by condition
  async updateOneByCondition(
    condition: FilterQuery<T>,
    data: UpdateQuery<T>,
    options: UpdateOptions & { session?: ClientSession } = {},
  ): Promise<T> {
    return this.updateOne(
      () =>
        this.model
          .findOneAndUpdate(condition, data, { new: true, ...options })
          .session(toMongooseSession(options.session)),
      'Document matching condition not found',
    );
  }

  // Delete document by ID
  async deleteById(id: string, session?: ClientSession): Promise<boolean> {
    this.ensureValidObjectId(id);
    return this.deleteOne(
      () => this.model.findByIdAndDelete(id).session(toMongooseSession(session)),
      `Document with ID ${id} not found`,
    );
  }

  // Delete one document matching a condition (optional session)
  async deleteOneByCondition(condition: FilterQuery<T>, session?: ClientSession): Promise<boolean> {
    return this.deleteOne(
      () => this.model.findOneAndDelete(condition).session(toMongooseSession(session)),
      'Document matching condition not found',
    );
  }

  // Count documents by condition
  async countByCondition(condition: FilterQuery<T>, session?: ClientSession): Promise<number> {
    return this.handleOperation(
      () =>
        this.model
          .countDocuments(condition)
          .session(toMongooseSession(session))
          .exec(),
      'Failed to count documents',
    );
  }

  // Check if document exists by condition
  async existsByCondition(condition: FilterQuery<T>, session?: ClientSession): Promise<boolean> {
    return this.handleOperation(
      async () => !!(await this.model.exists(condition).session(toMongooseSession(session))),
      'Failed to check existence',
    );
  }

  // Apply query options like select, populate, pagination, and sorting
  protected applyQueryOptions<R = Partial<T>>(
    query: Query<R, T, {}, T>,
    options: FindManyOptions = {},
  ): Query<R, T, {}, T> {
    // Select fields
    if (options.select) {
      query.select(options.select);
    }

    // Populate related fields
    if (options.populate) {
      const populateFields = Array.isArray(options.populate)
        ? options.populate
        : [options.populate];

      // Filter valid populate fields
      const validPopulateFields = populateFields.filter(field => {
        const fieldName = typeof field === 'string' ? field : field.path;
        const doc = query.getQuery();
        return !doc[fieldName] ||
          (doc[fieldName] &&
            (doc[fieldName] instanceof Types.ObjectId ||
              Types.ObjectId.isValid(doc[fieldName])));
      });

      if (validPopulateFields.length > 0) {
        query.populate(validPopulateFields as PopulateOptions | (string | PopulateOptions)[]);
      }
    }

    // Apply pagination (skip/limit)
    if (options.page !== undefined || options.perPage !== undefined) {
      const page = Math.max(1, options.page ?? 1);
      const perPage = Math.max(1, options.perPage ?? 10);
      query.skip((page - 1) * perPage).limit(perPage);
    }

    // Apply sorting
    if (options.sort?.length) {
      const sortObj: Record<string, 1 | -1> = Object.fromEntries(
        options.sort.map(({ field, order }) => [field, order === SortOrder.ASC ? 1 : -1]),
      );
      query.sort(sortObj);
    }

    return query;
  }

  // Wrap operation in try/catch with standardized error handling
  private async handleOperation<R>(operation: () => Promise<R>, errorMessage: string): Promise<R> {
    try {
      return await operation();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new BadRequestException(`${errorMessage}: ${message}`);
    }
  }

  // Generic "find one" wrapper
  private async findOne(fn: () => Promise<T | null>): Promise<T | null> {
    const result = await fn();
    return result;
  }

  // Generic "update one" wrapper with NotFound handling
  private async updateOne(fn: () => Promise<T | null>, notFoundMessage: string): Promise<T> {
    const result = await this.handleOperation(fn, 'Failed to update document');
    if (!result) {
      throw new NotFoundException(notFoundMessage);
    }
    return result;
  }

  // Generic "delete one" wrapper with NotFound handling
  private async deleteOne(fn: () => Promise<T | null>, notFoundMessage: string): Promise<boolean> {
    const result = await this.handleOperation(fn, 'Failed to delete document');
    this.ensureExists(result, notFoundMessage);
    return true;
  }

  // Ensure a document exists, otherwise throw NotFound
  private ensureExists(document: T | null, message: string): void {
    if (!document) {
      throw new NotFoundException(message);
    }
  }

  // Validate if a string is a valid MongoDB ObjectId
  private ensureValidObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ID format');
    }
  }
}
