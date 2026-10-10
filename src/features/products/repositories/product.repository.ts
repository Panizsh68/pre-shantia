import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession, PipelineStage, Types, FilterQuery } from 'mongoose';
import { Product } from '../entities/product.entity';
import { Order } from '../../orders/entities/order.entity';
import { OrdersStatus } from '../../orders/enums/orders.status.enum';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';
import {
  IBaseCrudRepository,
  IBaseAggregateRepository,
  IBaseTransactionRepository,
} from 'src/libs/repository/interfaces/base-repo.interfaces';
import { FindManyOptions, SortOption } from 'src/libs/repository/interfaces/base-repo-options.interface';

export interface IProductRepository extends IBaseCrudRepository<Product>, IBaseAggregateRepository<Product>, IBaseTransactionRepository<Product> {
  bulkDecrementStock(items: { productId: Types.ObjectId; qty: number }[], session?: ClientSession): Promise<number>;
  bulkIncrementStock(items: { productId: Types.ObjectId; qty: number }[], session?: ClientSession): Promise<number>;
  getTopProductsByRating(limit?: number, session?: ClientSession): Promise<Product[]>;
  getTopProductsBySales(limit?: number, session?: ClientSession): Promise<Product[]>;
  findByCompanyId(companyId: string | Types.ObjectId, options?: { page?: number; limit?: number; sort?: { field: string; order: 'asc' | 'desc' }[] }, session?: ClientSession): Promise<Product[]>;
  advancedSearchAggregate(
    params: {
      query?: string;
      minPrice?: number;
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
  /**
   * Atomically decrement stock for multiple products. Returns number of modified docs.
   * @param items [{ productId, qty }]
   * @param session
   */
  async bulkDecrementStock(
    items: { productId: Types.ObjectId; qty: number }[],
    session?: ClientSession
  ): Promise<number> {
    if (!items?.length) return 0;
    const bulkOps = items.map(it => ({
      updateOne: {
        filter: {
          _id: it.productId,
          'stock.quantity': { $gte: it.qty },
        },
        update: { $inc: { 'stock.quantity': -it.qty } },
      },
    }));
    const res = await (this.model as any).bulkWrite(bulkOps, { session });
    return res.modifiedCount || 0;
  }

  /**
   * Atomically increment stock for multiple products (e.g. reverting a failed order).
   * @param items [{ productId, qty }]
   * @param session
   */
  async bulkIncrementStock(
    items: { productId: Types.ObjectId; qty: number }[],
    session?: ClientSession
  ): Promise<number> {
    if (!items?.length) return 0;
    const bulkOps = items.map(it => ({
      updateOne: {
        filter: { _id: it.productId },
        update: { $inc: { 'stock.quantity': it.qty } },
      },
    }));
    const res = await (this.model as any).bulkWrite(bulkOps, { session });
    return res.modifiedCount || 0;
  }

  async getTopProductsByRating(limit = 5, session?: ClientSession): Promise<Product[]> {
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
          avgRate: { $ifNull: [{ $avg: '$ratings.rating' }, 0] },
          totalRatings: { $size: '$ratings' },
        },
      },
      { $match: { totalRatings: { $gt: 0 } } },
      { $sort: { avgRate: -1, totalRatings: -1, _id: 1 } },
      { $limit: limit },
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
        $set: {
          companyId: {
            _id: '$company._id',
            name: '$company.name',
          },
        },
      },
      {
        $project: {
          ratings: 0,
          company: 0,
        },
      },
    ];
    return this.aggregate<Product>(pipeline, session);
  }
  async advancedSearchAggregate(
    params: {
      query?: string;
      minPrice?: number;
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
      minPrice,
      maxPrice,
      companyName,
      categoryIds,
      page = 1,
      limit = 10,
      sort,
    } = params;
    const pipeline: PipelineStage[] = [];
    pipeline.push({ $match: { status: 'active' } });
    pipeline.push({
      $lookup: {
        from: 'companies',
        localField: 'companyId',
        foreignField: '_id',
        as: 'company',
      },
    });
    pipeline.push({ $unwind: { path: '$company', preserveNullAndEmptyArrays: true } });
    if (query && query.trim()) {
      const safeQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      pipeline.push({
        $match: {
          name: { $regex: safeQuery, $options: 'i' },
        },
      });
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceRange: Record<string, number> = {};
      if (minPrice !== undefined) priceRange.$gte = minPrice;
      if (maxPrice !== undefined) priceRange.$lte = maxPrice;
      pipeline.push({ $match: { basePrice: priceRange } });
    }
    if (companyName && companyName.trim()) {
      const safeCompanyName = companyName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      pipeline.push({ $match: { 'company.name': { $regex: safeCompanyName, $options: 'i' } } });
    }
    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      pipeline.push({
        $match: {
          categories: {
            $in: categoryIds
              .filter((id) => Types.ObjectId.isValid(id))
              .map((id) => new Types.ObjectId(id)),
          },
        },
      });
    }
    if (sort) {
      const [field, order] = sort.split(':');
      const sortField = field === 'rating' ? 'avgRate' : field;
      const allowedSortFields = new Set(['createdAt', 'basePrice', 'name', 'avgRate', 'totalRatings']);
      if (sortField && allowedSortFields.has(sortField) && order && ['asc', 'desc'].includes(order.toLowerCase())) {
        pipeline.push({ $sort: { [sortField]: order.toLowerCase() === 'asc' ? 1 : -1, _id: 1 } });
      }
    } else {
      pipeline.push({ $sort: { createdAt: -1, _id: 1 } });
    }
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: limit });
    // Catalog cards do not need descriptions, denormalized comments or the
    // full image gallery. Returning only the card payload cuts both MongoDB
    // work and the JSON sent to the browser; the detail endpoint remains the
    // source for the complete product document.
    pipeline.push({
      $project: {
        _id: 1,
        name: 1,
        slug: 1,
        sku: 1,
        basePrice: 1,
        discount: 1,
        currency: 1,
        companyId: {
          _id: '$company._id',
          name: '$company.name',
        },
        categories: 1,
        stock: 1,
        variants: 1,
        images: { $slice: ['$images', 1] },
        avgRate: 1,
        totalRatings: 1,
        finalPrice: {
          $multiply: [
            {
              $convert: {
                input: '$basePrice',
                to: 'double',
                onError: 0,
                onNull: 0,
              },
            },
            {
              $subtract: [
                1,
                {
                  $divide: [
                    {
                      $min: [
                        100,
                        {
                          $max: [
                            0,
                            {
                              $convert: {
                                input: '$discount',
                                to: 'double',
                                onError: 0,
                                onNull: 0,
                              },
                            },
                          ],
                        },
                      ],
                    },
                    100,
                  ],
                },
              ],
            },
          ],
        },
        status: 1,
        createdAt: 1,
      },
    });
    return this.aggregate<Product>(pipeline, session);
  }
  async searchByPriceAndCompanyAggregate(
    params: { maxPrice?: number; companyName?: string },
    page = 1,
    perPage = 10,
    session?: ClientSession,
    sort?: { field: string; order: 'asc' | 'desc' }[]
  ): Promise<Product[]> {
    const { maxPrice, companyName } = params;
    const match: Record<string, unknown> = {};
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
    private readonly orderModel: Model<Order>,
  ) {
    super(productModel);
  }

  async getTopProductsBySales(limit = 8, session?: ClientSession): Promise<Product[]> {
    const completedStatuses = [
      OrdersStatus.PAID,
      OrdersStatus.SHIPPED,
      OrdersStatus.DELIVERED,
      OrdersStatus.COMPLETED,
    ];

    const pipeline: PipelineStage[] = [
      { $match: { status: 'active' } },
      {
        $lookup: {
          from: this.orderModel.collection.name,
          let: { productId: { $toString: '$_id' } },
          pipeline: [
            { $match: { status: { $in: completedStatuses } } },
            { $unwind: '$items' },
            {
              $match: {
                $expr: {
                  $eq: [{ $toString: '$items.productId' }, '$$productId'],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalSold: { $sum: { $ifNull: ['$items.quantity', 0] } },
              },
            },
          ],
          as: 'sales',
        },
      },
      {
        $addFields: {
          totalSold: { $ifNull: [{ $arrayElemAt: ['$sales.totalSold', 0] }, 0] },
        },
      },
      { $match: { totalSold: { $gt: 0 } } },
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
        $set: {
          companyId: {
            _id: '$company._id',
            name: '$company.name',
          },
        },
      },
      { $sort: { totalSold: -1, avgRate: -1, createdAt: -1, _id: 1 } },
      { $limit: Math.max(1, limit) },
      { $project: { sales: 0, company: 0 } },
    ];

    return this.aggregate<Product>(pipeline, session);
  }

  async findByCompanyId(companyId: string | Types.ObjectId, options: { page?: number; limit?: number; sort?: { field: string; order: 'asc' | 'desc' }[] } = {}, session?: ClientSession): Promise<Product[]> {
    const condition: Record<string, unknown> = {};
    if (typeof companyId === 'string') {
      condition.companyId = Types.ObjectId.isValid(companyId) ? new Types.ObjectId(companyId) : companyId;
    } else {
      condition.companyId = companyId;
    }
    condition['status'] = 'active';

    const page = options.page ?? 1;
    const limit = options.limit ?? 10;

    const findOptions: FindManyOptions = {
      page,
      perPage: limit,
      sort: options.sort?.map(s => ({ field: s.field, order: s.order === 'asc' ? 'asc' : 'desc' } as SortOption)) as SortOption[],
    };

    return this.findManyByCondition(condition as FilterQuery<Product>, findOptions as FindManyOptions);
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
    page = 1,
    perPage = 10,
    session?: ClientSession
  ): Promise<Product[]> {
    function escapeRegExp(str: string): string {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    const trimmedQuery = query.trim();
    if (!trimmedQuery) { return []; }
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
