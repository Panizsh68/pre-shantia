import { Injectable, Inject } from '@nestjs/common';
import { ProductRatingRepository } from '../repositories/product-rating.repository';
import { IProductRatingService } from '../interfaces/product-rating.service.interface';
import { RatingStats } from '../types/rating-summary.type';
import { Types } from 'mongoose';

@Injectable()
export class ProductRatingService implements IProductRatingService {
  constructor(
    @Inject('ProductRatingRepository')
    private readonly ratingRepo: ProductRatingRepository,
  ) { }

  async recalculateProductRatings(productId: string): Promise<RatingStats> {
    return this.ratingRepo.recalculateRatingStats(
      typeof productId === 'string' ? new Types.ObjectId(productId) : productId
    );
  }

  async getProductRatingStats(productId: string): Promise<RatingStats> {
    const product = await this.ratingRepo.findById(productId);
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    return {
      avgRate: product.avgRate ?? 0,
      totalRatings: product.totalRatings ?? 0,
      ratingsSummary: product.ratingsSummary ?? { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
    };
  }

  async updateProductRatingStats(productId: string, stats: Partial<RatingStats>): Promise<void> {
    await this.ratingRepo.updateRatingStats(
      typeof productId === 'string' ? new Types.ObjectId(productId) : productId,
      stats
    );
  }
}