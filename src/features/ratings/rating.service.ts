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
   * - Maintains product.avgRate, product.totalRatings, product.ratingsSummary and product.denormComments
   * - Rounds avgRate to 2 decimals
   */
  async rateProduct(userId: string, dto: CreateRatingDto): Promise<IRating> {
    // Safe-guard validation (DTO also validates)
    if (dto.rating < 1 || dto.rating > 5) throw new BadRequestException('Rating must be between 1 and 5');

    const result = await runInTransaction(this.productRepo, async (session: ClientSession) => {
      // find existing rating (session-scoped)
      const existing = await this.repo.findByUserAndProduct(userId, dto.productId, session);

      // load product (session-scoped)
      const product = await this.productRepo.findById(dto.productId, { session });
      if (!product) throw new NotFoundException('Product not found');

      let stats = await this.productRatingService.getProductRatingStats(dto.productId);
      const { avgRate: oldAvg, totalRatings: oldCount, ratingsSummary } = stats;

      if (existing) {
        // UPDATE
        const oldRate = Number(existing.rating ?? 0);

        // If rating value changed -> adjust avg & summary
        if (oldRate !== dto.rating) {
          // update rating doc inside session
          const updatedRating = await this.repo.updateRating(userId, dto.productId, dto.rating, dto.comment, session);

          // compute new stats
          const newAvgUnrounded = oldCount > 0 ? ((oldAvg * oldCount - oldRate + dto.rating) / oldCount) : dto.rating;
          const newAvg = Math.round(newAvgUnrounded * 100) / 100;

          // update summary counts
          const newSummary = { ...ratingsSummary };
          newSummary[String(oldRate)] = Math.max(0, (newSummary[String(oldRate)] ?? 1) - 1);
          newSummary[String(dto.rating)] = (newSummary[String(dto.rating)] ?? 0) + 1;

          // update via rating service
          await this.productRatingService.updateProductRatingStats(dto.productId, {
            avgRate: newAvg,
            ratingsSummary: newSummary
          });

          // if comment changed, recalculate all stats to ensure consistency
          if (dto.comment !== undefined) {
            await this.productRatingService.recalculateProductRatings(dto.productId);
          }

          return toPlain<IRating>(updatedRating as any);
        }

        // rating value unchanged -> possibly update comment only
        if (dto.comment !== undefined && dto.comment !== existing.comment) {
          const updatedRating = await this.repo.updateRating(userId, dto.productId, dto.rating, dto.comment, session);
          await this.productRatingService.recalculateProductRatings(dto.productId);
          return toPlain<IRating>(updatedRating as any);
        }

        // nothing changed
        return toPlain<IRating>(existing as any);
      }

      // INSERT
      let createdRating: any;
      try {
        createdRating = await this.repo.createOne({ userId: toObjectId(userId), productId: toObjectId(dto.productId), rating: dto.rating, comment: dto.comment } as any, session);
      } catch (err) {
        // handle duplicate-key races: if another request created it concurrently, fetch and treat as update
        if ((err as any)?.code === 11000) {
          const concurrent = await this.repo.findByUserAndProduct(userId, dto.productId, session);
          if (concurrent) return toPlain<IRating>(concurrent as any);
        }
        throw err;
      }

      // Calculate new stats
      const newCount = oldCount + 1;
      const newAvgUnrounded = oldCount === 0 ? dto.rating : ((oldAvg * oldCount + dto.rating) / newCount);
      const newAvg = Math.round(newAvgUnrounded * 100) / 100;

      const newSummary = { ...ratingsSummary };
      newSummary[String(dto.rating)] = (newSummary[String(dto.rating)] ?? 0) + 1;

      // Update stats via rating service
      await this.productRatingService.updateProductRatingStats(dto.productId, {
        avgRate: newAvg,
        totalRatings: newCount,
        ratingsSummary: newSummary
      });

      // If comment provided, recalculate to ensure consistency
      if (dto.comment) {
        await this.productRatingService.recalculateProductRatings(dto.productId);
      }

      return toPlain<IRating>(createdRating as any);
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
    // reuse rateProduct transactional implementation
    const updated = await this.rateProduct(userId, dto);
    return updated ?? null;
  }

  async deleteProductRating(userId: string, productId: string): Promise<void> {
    // perform delete inside a transaction to update product denorm fields
    await runInTransaction(this.productRepo, async (session: ClientSession) => {
      const existing = await this.repo.findByUserAndProduct(userId, productId, session);
      if (!existing) throw new NotFoundException('Rating not found');

      const product = await this.productRepo.findById(productId, { session });
      if (!product) throw new NotFoundException('Product not found');

      const oldAvg = Number(product.avgRate ?? 0);
      const oldCount = Number(product.totalRatings ?? 0);
      const ratingsSummary: Record<string, number> = Object.assign({}, product.ratingsSummary ?? {});
      for (let r = 1; r <= 5; r++) ratingsSummary[String(r)] = Number(ratingsSummary[String(r)] ?? 0);
      const denormComments = Array.isArray(product.denormComments) ? [...product.denormComments] : [];

      // remove rating doc
      await this.repo.deleteRating(userId, productId, session);

      // update summary and avg
      const oldRate = Number(existing.rating ?? 0);
      ratingsSummary[String(oldRate)] = Math.max(0, (ratingsSummary[String(oldRate)] ?? 1) - 1);

      const newCount = Math.max(0, oldCount - 1);
      const newAvgUnrounded = newCount > 0 ? ((oldAvg * oldCount - oldRate) / newCount) : 0;
      const newAvg = Math.round(newAvgUnrounded * 100) / 100;

      // remove denorm comment entry for user if present
      const idx = denormComments.findIndex(c => String(c.userId) === String(userId));
      if (idx >= 0) denormComments.splice(idx, 1);

      await this.productRepo.updateById(productId, { $set: { avgRate: newAvg, ratingsSummary, denormComments }, $inc: { totalRatings: -1 } } as any, session);
    });
  }

  async getProductRatingsCount(productId: string): Promise<number> {
    return this.repo.getRatingsCount(productId);
  }
}

