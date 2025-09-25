import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { Inject } from '@nestjs/common';
import { toPlain, toPlainArray } from 'src/libs/repository/utils/doc-mapper';
import { IRatingRepository } from './repositories/rating.repository';
import { CreateRatingDto } from './dto/create-rating.dto';
import { IRatingService } from './interfaces/rating.service.interface';
import { IRating } from './interfaces/rating.interface';

@Injectable()
export class RatingService implements IRatingService {
  constructor(
    @Inject('RatingRepository')
    private readonly repo: IRatingRepository,
  ) { }

  async rateProduct(userId: string, dto: CreateRatingDto): Promise<IRating> {
    const ratingDoc = await this.repo.upsertRating(
      userId,
      dto.productId,
      dto.rating,
      dto.comment
    );
    return toPlain<IRating>(ratingDoc);
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
    const rating = await this.repo.updateRating(userId, dto.productId, dto.rating, dto.comment);
    return rating ? toPlain<IRating>(rating) : null;
  }

  async deleteProductRating(userId: string, productId: string): Promise<void> {
    await this.repo.deleteRating(userId, productId);
  }

  async getProductRatingsCount(productId: string): Promise<number> {
    return this.repo.getRatingsCount(productId);
  }
}
