import { Types, ClientSession } from 'mongoose';
import { RatingStats, DenormComment } from '../types/rating-summary.type';

export interface IProductRepository {
  updateRatingStats(productId: string | Types.ObjectId, stats: Partial<RatingStats>, increments?: Record<string, number>, session?: ClientSession): Promise<void>;
  addDenormComment(productId: string | Types.ObjectId, comment: DenormComment, session?: ClientSession): Promise<void>;
  addOrUpdateDenormComment(productId: string | Types.ObjectId, comment: DenormComment, isUpdate: boolean, session?: ClientSession): Promise<void>;
  removeDenormComment(productId: string | Types.ObjectId, userId: string | Types.ObjectId, session?: ClientSession): Promise<void>;
  recalculateRatingStats(productId: string | Types.ObjectId, session?: ClientSession): Promise<RatingStats>;
}
