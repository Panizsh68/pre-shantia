import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { Inject } from '@nestjs/common';
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
    return ratingDoc.toObject() as IRating;
  }

  async getProductRatings(productId: string): Promise<IRating[]> {
    const ratings = await this.repo.findByProduct(productId);
    return ratings.map(r => r.toObject() as IRating);
  }

  async getProductAverageRating(productId: string): Promise<number> {
    return this.repo.getAverageRating(productId);
  }

  async getUserProductRating(userId: string, productId: string): Promise<IRating | null> {
    const rating = await this.repo.findByUserAndProduct(userId, productId);
    return rating ? (rating.toObject() as IRating) : null;
  }

  async updateProductRating(userId: string, dto: CreateRatingDto): Promise<IRating | null> {
    const rating = await this.repo.updateRating(userId, dto.productId, dto.rating, dto.comment);
    return rating ? (rating.toObject() as IRating) : null;
  }

  async deleteProductRating(userId: string, productId: string): Promise<void> {
    await this.repo.deleteRating(userId, productId);
  }

  async getProductRatingsCount(productId: string): Promise<number> {
    return this.repo.getRatingsCount(productId);
  }
}
