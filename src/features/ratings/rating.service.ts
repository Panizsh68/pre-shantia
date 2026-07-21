import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Types, ClientSession } from 'mongoose';
import { Inject } from '@nestjs/common';
import { toPlain, toPlainArray } from 'src/libs/repository/utils/doc-mapper';
import { IRatingRepository } from './repositories/rating.repository';
import { IProductRepository } from 'src/features/products/repositories/product.repository';
import { IProductRatingService } from 'src/features/products/interfaces/product-rating.service.interface';
import { runInTransaction } from 'src/libs/repository/run-in-transaction';
import { CreateRatingDto } from './dto/create-rating.dto';
import { IRatingService } from './interfaces/rating.service.interface';
import { IRating } from './interfaces/rating.interface';
import { toObjectId } from 'src/utils/objectid.util';

@Injectable()
export class RatingService implements IRatingService {
  constructor(
    @Inject('RatingRepository')
    private readonly repo: IRatingRepository,
    @Inject('ProductRepository')
    private readonly productRepo: IProductRepository,
    @Inject('IProductRatingService')
    private readonly productRatingService: IProductRatingService,
  ) { }

  /**
   * Create or update a user's rating for a product atomically.
   * - Uses a DB transaction (productRepo as transaction owner)
   * - Optimized: Atomic increments for counts and in-memory average calculation to avoid heavy joins.
   */
  async rateProduct(userId: string, dto: CreateRatingDto): Promise<IRating> {
    if (dto.rating < 1 || dto.rating > 5) throw new BadRequestException('Rating must be between 1 and 5');

    const result = await runInTransaction(this.productRepo, async (session: ClientSession) => {
      // 1. Fetch current state inside transaction
      const existing = await this.repo.findByUserAndProduct(userId, dto.productId, session);
      const product = await (this.productRepo as any).findById(dto.productId, { session });
      if (!product) throw new NotFoundException('Product not found');

      const isUpdate = !!existing;
      const oldRating = existing ? existing.rating : 0;
      const newRating = dto.rating;

      // 2. Save/Update the rating record
      let savedRating: any;
      if (isUpdate) {
        savedRating = await this.repo.updateRating(userId, dto.productId, newRating, dto.comment, session);
      } else {
        savedRating = await this.repo.createOne({ 
          userId: toObjectId(userId), 
          productId: toObjectId(dto.productId), 
          rating: newRating, 
          comment: dto.comment 
        } as any, session);
      }

      // 3. Calculate new stats atomically
      const currentTotal = product.totalRatings || 0;
      const currentAvg = product.avgRate || 0;
      const currentSum = currentAvg * currentTotal;
      
      const nextTotal = isUpdate ? currentTotal : currentTotal + 1;
      const nextSum = currentSum - oldRating + newRating;
      const nextAvg = nextTotal > 0 ? nextSum / nextTotal : 0;

      const increments: Record<string, number> = {};
      increments[`ratingsSummary.${newRating}`] = 1;
      if (isUpdate) {
        increments[`ratingsSummary.${oldRating}`] = -1;
      } else {
        increments.totalRatings = 1;
      }

      // 4. Update Product Denorm Fields
      await this.productRatingService.updateProductRatingStats(
        dto.productId, 
        { avgRate: Math.round(nextAvg * 100) / 100, totalRatings: nextTotal },
        increments,
        session
      );

      // 5. Update Denorm Comment
      await this.productRatingService.addOrUpdateDenormComment(
        dto.productId,
        { userId, rating: newRating, comment: dto.comment, createdAt: new Date() },
        isUpdate,
        session
      );

      return toPlain<IRating>(savedRating as any);
    });

    return result as IRating;
  }

  async getProductRatings(productId: string): Promise<IRating[]> {
    const ratings = await this.repo.findByProduct(productId);
    return toPlainArray<IRating>(ratings);
  }

  async getProductAverageRating(productId: string): Promise<number> {
    return this.repo.getAverageRating(productId);
  }

  async getUserProductRating(userId: string, productId: string): Promise<IRating | null> {
    const rating = await this.repo.findByUserAndProduct(userId, productId);
    return rating ? toPlain<IRating>(rating) : null;
  }

  async updateProductRating(userId: string, dto: CreateRatingDto): Promise<IRating | null> {
    const updated = await this.rateProduct(userId, dto);
    return updated ?? null;
  }

  async deleteProductRating(userId: string, productId: string): Promise<void> {
    await runInTransaction(this.productRepo, async (session: ClientSession) => {
      const existing = await this.repo.findByUserAndProduct(userId, productId, session);
      if (!existing) throw new NotFoundException('Rating not found');

      const product = await (this.productRepo as any).findById(productId, { session });
      if (!product) throw new NotFoundException('Product not found');

      const oldRating = existing.rating;
      const currentTotal = product.totalRatings || 0;
      const currentAvg = product.avgRate || 0;
      const currentSum = currentAvg * currentTotal;

      const nextTotal = Math.max(0, currentTotal - 1);
      const nextSum = Math.max(0, currentSum - oldRating);
      const nextAvg = nextTotal > 0 ? nextSum / nextTotal : 0;

      // 1. Delete actual rating record
      await this.repo.deleteRating(userId, productId, session);

      // 2. Atomic update product counts and avg
      const increments: Record<string, number> = {
        totalRatings: -1
      };
      increments[`ratingsSummary.${oldRating}`] = -1;

      await this.productRatingService.updateProductRatingStats(
        productId,
        { avgRate: Math.round(nextAvg * 100) / 100, totalRatings: nextTotal },
        increments,
        session
      );

      // 3. Remove denorm comment
      await this.productRatingService.removeDenormComment(productId, userId, session);
    });
  }

  async getProductRatingsCount(productId: string): Promise<number> {
    return this.repo.getRatingsCount(productId);
  }
}
