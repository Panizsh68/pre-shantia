import { Injectable, BadRequestException } from '@nestjs/common';
import { Model, ClientSession, Types } from 'mongoose';
import { Product } from '../entities/product.entity';
import { RatingStats, DenormComment } from '../types/rating-summary.type';
import { IProductRepository } from '../interfaces/product-rating.repository.interface';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';

@Injectable()
export class ProductRatingRepository extends BaseCrudRepository<Product> implements IProductRepository {
  constructor(model: Model<Product>) {
    super(model);
  }

  async updateRatingStats(
    productId: string | Types.ObjectId,
    stats: Partial<RatingStats>,
    increments?: Record<string, number>,
    session?: ClientSession
  ): Promise<void> {
    const update: any = {};
    const sets: any = {};

    if (stats.avgRate !== undefined) {
      sets.avgRate = stats.avgRate;
    }
    if (stats.totalRatings !== undefined) {
      sets.totalRatings = stats.totalRatings;
    }

    if (Object.keys(sets).length > 0) {
      update.$set = sets;
    }

    if (increments && Object.keys(increments).length > 0) {
      update.$inc = increments;
    }

    await this.model.findByIdAndUpdate(
      productId,
      update,
      { session }
    );
  }

  async addDenormComment(
    productId: string | Types.ObjectId,
    comment: DenormComment,
    session?: ClientSession
  ): Promise<void> {
    await this.model.findByIdAndUpdate(
      productId,
      {
        $push: {
          denormComments: {
            $each: [{
              userId: comment.userId,
              rating: comment.rating,
              comment: comment.comment,
              createdAt: comment.createdAt
            }],
            $slice: -10 // Keep only last 10 comments to prevent document bloat
          }
        }
      },
      { session }
    );
  }

  async addOrUpdateDenormComment(
    productId: string | Types.ObjectId,
    comment: DenormComment,
    isUpdate: boolean,
    session?: ClientSession
  ): Promise<void> {
    if (isUpdate) {
      // Update existing comment for this user
      await this.model.updateOne(
        { 
          _id: typeof productId === 'string' ? new Types.ObjectId(productId) : productId, 
          'denormComments.userId': typeof comment.userId === 'string' ? new Types.ObjectId(comment.userId) : comment.userId 
        },
        { 
          $set: { 
            'denormComments.$.rating': comment.rating,
            'denormComments.$.comment': comment.comment,
            'denormComments.$.createdAt': comment.createdAt 
          } 
        },
        { session }
      );
    } else {
      // Add new comment (capped at 10)
      await this.addDenormComment(productId, comment, session);
    }
  }

  async removeDenormComment(
    productId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    session?: ClientSession
  ): Promise<void> {
    await this.model.findByIdAndUpdate(
      productId,
      {
        $pull: {
          denormComments: {
            userId: typeof userId === 'string' ? new Types.ObjectId(userId) : userId
          }
        }
      },
      { session }
    );
  }

  async recalculateRatingStats(
    productId: string | Types.ObjectId,
    session?: ClientSession
  ): Promise<RatingStats> {
    const [result] = await this.model.aggregate([
      { $match: { _id: typeof productId === 'string' ? new Types.ObjectId(productId) : productId } },
      {
        $lookup: {
          from: 'ratings',
          localField: '_id',
          foreignField: 'productId',
          as: 'ratings'
        }
      },
      {
        $project: {
          avgRate: { $avg: '$ratings.rating' },
          totalRatings: { $size: '$ratings' },
          ratingsSummary: {
            $reduce: {
              input: '$ratings',
              initialValue: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [[
                      {
                        k: { $toString: '$$this.rating' },
                        v: {
                          $add: [{
                            $getField: {
                              field: { $toString: '$$this.rating' },
                              input: '$$value'
                            }
                          }, 1]
                        }
                      }
                    ]]
                  }
                ]
              }
            }
          }
        }
      }
    ]).session(session ?? null);

    if (!result) {
      throw new Error(`Product ${productId} not found`);
    }

    const stats: RatingStats = {
      avgRate: Math.round((result.avgRate || 0) * 100) / 100,
      totalRatings: result.totalRatings || 0,
      ratingsSummary: result.ratingsSummary || { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
    };

    // Note: This still uses the heavy aggregation but is kept for data repair or non-hot paths
    await this.model.findByIdAndUpdate(productId, { $set: stats }, { session });

    return stats;
  }
}
