import { Injectable, BadRequestException } from '@nestjs/common';
import { Model, ClientSession } from 'mongoose';
import { Rating } from '../entity/rating.entity';
import { IRating } from '../interfaces/rating.interface';
import { BaseCrudRepository } from 'src/libs/repository/base-repos/base-crud.repository';

export interface IRatingRepository extends BaseCrudRepository<Rating> {
  upsertRating(userId: string, productId: string, rating: number, comment?: string, session?: ClientSession): Promise<Rating>;
  findByProduct(productId: string): Promise<Rating[]>;
  findByUserAndProduct(userId: string, productId: string): Promise<Rating | null>;
  updateRating(userId: string, productId: string, rating: number, comment?: string): Promise<Rating | null>;
  deleteRating(userId: string, productId: string): Promise<void>;
  getAverageRating(productId: string): Promise<number>;
  getRatingsCount(productId: string): Promise<number>;
}

@Injectable()
export class RatingRepository extends BaseCrudRepository<Rating> implements IRatingRepository {
  constructor(ratingModel: Model<Rating>) {
    super(ratingModel);
  }

  async upsertRating(userId: string, productId: string, rating: number, comment?: string, session?: ClientSession): Promise<Rating> {
    const existing = await this.model.findOne({ userId, productId }).session(session ?? null);
    if (existing) {
      existing.rating = rating;
      if (comment !== undefined) existing.comment = comment;
      await existing.save({ session });
      return existing;
    }
    const created = await this.model.create([{ userId, productId, rating, comment }], { session });
    return created[0];
  }

  async findByProduct(productId: string): Promise<Rating[]> {
    return this.model.find({ productId }).exec();
  }

  async findByUserAndProduct(userId: string, productId: string): Promise<Rating | null> {
    return this.model.findOne({ userId, productId }).exec();
  }

  async updateRating(userId: string, productId: string, rating: number, comment?: string): Promise<Rating | null> {
    const updated = await this.model.findOneAndUpdate(
      { userId, productId },
      { rating, ...(comment !== undefined ? { comment } : {}) },
      { new: true }
    ).exec();
    return updated;
  }

  async deleteRating(userId: string, productId: string): Promise<void> {
    await this.model.deleteOne({ userId, productId }).exec();
  }

  async getAverageRating(productId: string): Promise<number> {
    const result = await this.model.aggregate([
      { $match: { productId } },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);
    return result[0]?.avg ?? 0;
  }

  async getRatingsCount(productId: string): Promise<number> {
    return this.model.countDocuments({ productId }).exec();
  }
}
