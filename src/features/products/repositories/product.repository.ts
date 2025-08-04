import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession, PipelineStage } from 'mongoose';
import { Product } from '../entities/product.entity';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';
import {
  IBaseCrudRepository,
  IBaseAggregateRepository,
  IBaseTransactionRepository,
} from 'src/libs/repository/interfaces/base-repo.interfaces';

export interface IProductRepository extends IBaseCrudRepository<Product>, IBaseAggregateRepository<Product>, IBaseTransactionRepository<Product> {
  getTopProductsByRating(limit?: number, session?: ClientSession): Promise<any[]>;
  advancedSearchAggregate(
    params: {
      query?: string;
      maxPrice?: number;
      companyName?: string;
      categoryIds?: string[];
      page?: number;
      limit?: number;
      sort?: string;
    },
    session?: ClientSession
  ): Promise<Product[]>;
  searchByPriceAndCompanyAggregate(
    params: { maxPrice?: number; companyName?: string },
    page?: number,
    perPage?: number,
    session?: ClientSession,
    sort?: { field: string; order: 'asc' | 'desc' }[]
  ): Promise<Product[]>;
  searchProductsAggregate(
    query: string,
    page?: number,
    perPage?: number,
    session?: ClientSession
  ): Promise<Product[]>;
}

@Injectable()
export class ProductRepository extends BaseCrudRepository<Product> implements IProductRepository {
  async getTopProductsByRating(limit: number = 5, session?: ClientSession): Promise<any[]> {
    const pipeline: PipelineStage[] = [
      { $match: { status: 'active' } },
      {
        $lookup: {
          from: 'ratings',
          localField: '_id',
          foreignField: 'productId',
          as: 'ratings',
        },
      },
      {
        $addFields: {
          avgRating: { $avg: '$ratings.rating' },
        },
      },
      { $sort: { avgRating: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          name: 1,
          avgRating: 1,
          company: 1,
        },
      },
    ];
    return this.aggregate<any>(pipeline, session);
  }
  async advancedSearchAggregate(
    params: {
      query?: string;
      maxPrice?: number;
      companyName?: string;
      categoryIds?: string[];
      page?: number;
      limit?: number;
      sort?: string;
    },
    session?: ClientSession
  ): Promise<Product[]> {
    const {
      query,
      maxPrice,
      companyName,
      categoryIds,
      page = 1,
      limit = 10,
      sort,
    } = params;
    const pipeline: PipelineStage[] = [];
    pipeline.push({ $match: { status: 'active' } });
    if (query && query.trim()) {
      pipeline.push({
        $match: {
          name: { $regex: query.trim(), $options: 'i' },
        },
      });
    }
    if (maxPrice !== undefined) {
      pipeline.push({ $match: { basePrice: { $lte: maxPrice } } });
    }
    if (companyName && companyName.trim()) {
      pipeline.push({
        $lookup: {
          from: 'companies',
          localField: 'companyId',
          foreignField: '_id',
          as: 'company',
        },
      });
      pipeline.push({ $unwind: '$company' });
      pipeline.push({ $match: { 'company.name': { $regex: companyName.trim(), $options: 'i' } } });
    }
    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      pipeline.push({
        $match: {
          categories: { $in: categoryIds.map(id => id.length === 24 ? new (require('mongoose').Types.ObjectId)(id) : id) },
        },
      });
    }
    if (sort) {
      const [field, order] = sort.split(':');
      if (field && order && ['asc', 'desc'].includes(order.toLowerCase())) {
        pipeline.push({ $sort: { [field]: order.toLowerCase() === 'asc' ? 1 : -1 } });
      }
    } else {
      pipeline.push({ $sort: { createdAt: -1 } });
    }
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: limit });
    return this.aggregate<Product>(pipeline, session);
  }
  async searchByPriceAndCompanyAggregate(
    params: { maxPrice?: number; companyName?: string },
    page: number = 1,
    perPage: number = 10,
    session?: ClientSession,
    sort?: { field: string; order: 'asc' | 'desc' }[]
  ): Promise<Product[]> {
    const { maxPrice, companyName } = params;
    const match: any = {};
    if (typeof maxPrice === 'number') {
      match.basePrice = { $lte: maxPrice };
    }
    const skip = (page - 1) * perPage;
    const limit = perPage;
    const pipeline: PipelineStage[] = [
      {
        $match: match,
      },
      {
        $lookup: {
          from: 'companies',
          localField: 'companyId',
          foreignField: '_id',
          as: 'company',
        },
      },
      { $unwind: { path: '$company', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'categories',
          foreignField: '_id',
          as: 'categories',
        },
      },
    ];
    if (companyName && companyName.trim()) {
      const safeCompanyName = companyName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(safeCompanyName, 'i');
      pipeline.push({ $match: { 'company.name': { $regex: regex } } });
    }
    if (sort && Array.isArray(sort) && sort.length > 0) {
      const sortObj: Record<string, 1 | -1> = {};
      for (const s of sort) {
        if (s.field && s.order) {
          sortObj[s.field] = s.order === 'asc' ? 1 : -1;
        }
      }
      pipeline.push({ $sort: sortObj });
    }
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });
    return this.aggregate<Product>(pipeline, session);
  }
  constructor(
    productModel: Model<Product>,
    private readonly aggregateRepository: IBaseAggregateRepository<Product>,
    private readonly transactionRepository: IBaseTransactionRepository<Product>,
  ) {
    super(productModel);
  }

  async aggregate<R>(pipeline: PipelineStage[], session?: ClientSession): Promise<R[]> {
    try {
      return await this.aggregateRepository.aggregate(pipeline, session);
    } catch (error) {
      throw new BadRequestException(`Aggregation failed: ${(error as Error).message}`);
    }
  }

  async searchProductsAggregate(
    query: string,
    page: number = 1,
    perPage: number = 10,
    session?: ClientSession
  ): Promise<Product[]> {
    function escapeRegExp(str: string): string {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];
    const safeQuery = escapeRegExp(trimmedQuery);
    const regex = new RegExp(safeQuery, 'i');
    const skip = (page - 1) * perPage;
    const limit = perPage;
    const pipeline: PipelineStage[] = [
      {
        $lookup: {
          from: 'companies',
          localField: 'companyId',
          foreignField: '_id',
          as: 'company',
        },
      },
      { $unwind: { path: '$company', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'categories',
          foreignField: '_id',
          as: 'categories',
        },
      },
      {
        $match: {
          $or: [
            { name: { $regex: regex } },
            { 'company.name': { $regex: regex } },
            { 'categories.name': { $regex: regex } },
          ],
        },
      },
      { $skip: skip },
      { $limit: limit },
    ];
    return this.aggregate<Product>(pipeline, session);
  }

  async startTransaction(): Promise<ClientSession> {
    const session = await this.transactionRepository.startTransaction();
    return session;
  }

  async commitTransaction(session: ClientSession): Promise<void> {
    await this.transactionRepository.commitTransaction(session);
  }

  async abortTransaction(session: ClientSession): Promise<void> {
    await this.transactionRepository.abortTransaction(session);
  }
}
