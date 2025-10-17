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
    session?: ClientSession
  ): Promise<void> {
    const update: Record<string, any> = {};
    if (stats.avgRate !== undefined) {
      update.avgRate = stats.avgRate;
    }
    if (stats.totalRatings !== undefined) {
      update.totalRatings = stats.totalRatings;
    }
    if (stats.ratingsSummary !== undefined) {
      update.ratingsSummary = stats.ratingsSummary;
    }
    
    await this.model.findByIdAndUpdate(
      productId,
      { $set: update },
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
            userId: comment.userId,
            rating: comment.rating,
            comment: comment.comment,
            createdAt: comment.createdAt
          } 
        } 
      },
      { session }
    );
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
    // Execute aggregation to recalculate stats from ratings collection
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
                      { k: { $toString: '$$this.rating' }, 
                        v: { $add: [{ $getField: { 
                          field: { $toString: '$$this.rating' }, 
                          input: '$$value' 
                        }}, 1] }
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

    // Round avgRate to 2 decimal places
    const stats: RatingStats = {
      avgRate: Math.round((result.avgRate || 0) * 100) / 100,
      totalRatings: result.totalRatings || 0,
      ratingsSummary: result.ratingsSummary || { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
    };

    // Update the product with recalculated stats
    await this.updateRatingStats(productId, stats, session);

    return stats;
  }
}