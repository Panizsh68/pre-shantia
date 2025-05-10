import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { QueryOptionsDto } from './query-options.dto';

// Interface defining the contract for repository operations
export interface IBaseRepository<T> {
  create(data: Partial<T>): Promise<T>;
  findOne(id: string, populate?: string[]): Promise<T | null>;
  findAll(options: QueryOptionsDto): Promise<T[]>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

@Injectable()
export class BaseRepository<T> implements IBaseRepository<T> {
  private readonly model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(data: Partial<T>): Promise<T> {
    const createdDoc = await this.model.create(data);
    return createdDoc;
  }

  async findOne(id: string, populate: string[] = []): Promise<T | null> {
    let query = this.model.findById(id);
    
    if (populate.length > 0) {
      query = query.populate(populate);
    }

    const doc = await query.exec();
    return doc;
  }

  async findAll(options: QueryOptionsDto): Promise<T[]> {
    const { page, limit, sortBy, sortOrder, populate = [] } = options;
    let query = this.model.find();

    if (sortBy && sortOrder) {
      query = query.sort({ [sortBy]: sortOrder });
    }

    if (page && limit) {
      query = query.skip((page - 1) * limit).limit(limit);
    }

    if (populate.length > 0) {
      query = query.populate(populate);
    }

    const docs = await query.exec();
    return docs;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const updatedDoc = await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
    return updatedDoc;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }
}