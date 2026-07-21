import { RatingStats, DenormComment } from '../types/rating-summary.type';
import { ClientSession } from 'mongoose';

export interface IProductRatingService {
  recalculateProductRatings(productId: string): Promise<RatingStats>;
  getProductRatingStats(productId: string): Promise<RatingStats>;
  updateProductRatingStats(productId: string, stats: Partial<RatingStats>, increments?: Record<string, number>, session?: ClientSession): Promise<void>;
  addOrUpdateDenormComment(productId: string, comment: DenormComment, isUpdate: boolean, session?: ClientSession): Promise<void>;
  removeDenormComment(productId: string, userId: string, session?: ClientSession): Promise<void>;
}
