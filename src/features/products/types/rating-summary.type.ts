import { Types } from 'mongoose';

export interface RatingSummary {
  [key: string]: number;  // Key is rating value '1' to '5', value is count
}

export interface DenormComment {
  userId: string | Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface RatingStats {
  avgRate: number;
  totalRatings: number;
  ratingsSummary: RatingSummary;
}