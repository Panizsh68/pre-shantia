import { CreateRatingDto } from '../dto/create-rating.dto';
import { IRating } from './rating.interface';

export interface IRatingService {
  rateProduct(userId: string, dto: CreateRatingDto): Promise<IRating>;
  getProductRatings(productId: string): Promise<IRating[]>;
  getProductAverageRating(productId: string): Promise<number>;
  getUserProductRating(userId: string, productId: string): Promise<IRating | null>;
  updateProductRating(userId: string, dto: CreateRatingDto): Promise<IRating | null>;
  deleteProductRating(userId: string, productId: string): Promise<void>;
  getProductRatingsCount(productId: string): Promise<number>;
}
