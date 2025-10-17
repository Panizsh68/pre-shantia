import { RatingStats } from '../types/rating-summary.type';

export interface IProductRatingService {
  recalculateProductRatings(productId: string): Promise<RatingStats>;
  getProductRatingStats(productId: string): Promise<RatingStats>;
  updateProductRatingStats(productId: string, stats: Partial<RatingStats>): Promise<void>;
}