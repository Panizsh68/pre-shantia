import { Injectable, BadRequestException } from '@nestjs/common';
import { Model, ClientSession } from 'mongoose';
import { Rating } from '../entity/rating.entity';
import { IRating } from '../interfaces/rating.interface';
import { toMongooseSession } from 'src/libs/repository/session-utils';
import { BaseCrudRepository } from 'src/libs/repository/base-repos/base-crud.repository';
import { toObjectId } from 'src/utils/objectid.util';
import { IBaseCrudRepository } from 'src/libs/repository/interfaces/base-repo.interfaces';

export interface IRatingRepository extends IBaseCrudRepository<Rating> {
  upsertRating(userId: string, productId: string, rating: number, comment?: string, session?: ClientSession): Promise<Rating>;
  findByProduct(productId: string, session?: ClientSession): Promise<Rating[]>;
  findByUserAndProduct(userId: string, productId: string, session?: ClientSession): Promise<Rating | null>;
  updateRating(userId: string, productId: string, rating: number, comment?: string, session?: ClientSession): Promise<Rating | null>;
  deleteRating(userId: string, productId: string, session?: ClientSession): Promise<void>;
  getAverageRating(productId: string, session?: ClientSession): Promise<number>;
  getRatingsCount(productId: string, session?: ClientSession): Promise<number>;
}

@Injectable()
export class RatingRepository extends BaseCrudRepository<Rating> implements IRatingRepository {
  constructor(ratingModel: Model<Rating>) {
    super(ratingModel);
  }

  async upsertRating(userId: string, productId: string, rating: number, comment?: string, session?: ClientSession): Promise<Rating> {
    const existing = await this.findOneByCondition({ userId: toObjectId(userId), productId: toObjectId(productId) }, { session });
    if (existing) {
      existing.rating = rating;
      if (comment !== undefined) { existing.comment = comment; }
      await this.saveOne(existing, session);
      return existing;
    }
    const created = await this.createOne({ userId: toObjectId(userId), productId: toObjectId(productId), rating, comment } as Partial<Rating>, session);
    return created;
  }

  async findByProduct(productId: string, session?: ClientSession): Promise<Rating[]> {
    return this.findManyByCondition({ productId: toObjectId(productId) }, { session });
  }

  async findByUserAndProduct(userId: string, productId: string, session?: ClientSession): Promise<Rating | null> {
    return this.findOneByCondition({ userId: toObjectId(userId), productId: toObjectId(productId) }, { session });
  }

  async updateRating(userId: string, productId: string, rating: number, comment?: string, session?: ClientSession): Promise<Rating | null> {
    try {
      const updated = await this.updateOneByCondition(
        { userId: toObjectId(userId), productId: toObjectId(productId) } as any,
        { $set: { rating, ...(comment !== undefined ? { comment } : {}) } },
        { new: true, session },
      );
      return updated;
    } catch (err) {
      return null;
    }
  }

  async deleteRating(userId: string, productId: string, session?: ClientSession): Promise<void> {
    await this.deleteOneByCondition({ userId: toObjectId(userId), productId: toObjectId(productId) }, session);
  }

  async getAverageRating(productId: string, session?: ClientSession): Promise<number> {
    const result = await this.model.aggregate([
      { $match: { productId: toObjectId(productId) } },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]).exec();
    return result[0]?.avg ?? 0;
  }

  async getRatingsCount(productId: string, session?: ClientSession): Promise<number> {
    return this.countByCondition({ productId: toObjectId(productId) }, session);
  }
}
