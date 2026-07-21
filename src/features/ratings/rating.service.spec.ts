import { RatingService } from './rating.service';
import { IRatingRepository } from './repositories/rating.repository';
import { IProductRepository } from 'src/features/products/repositories/product.repository';
import { IProductRatingService } from 'src/features/products/interfaces/product-rating.service.interface';

describe('RatingService (unit)', () => {
  let service: RatingService;
  let ratingRepo: Partial<IRatingRepository>;
  let productRepo: Partial<IProductRepository>;
  let productRatingService: Partial<IProductRatingService>;

  beforeEach(() => {
    ratingRepo = {
      findByUserAndProduct: jest.fn(),
      createOne: jest.fn(),
      saveOne: jest.fn(),
      updateRating: jest.fn(),
    } as any;

    productRepo = {
      findById: jest.fn(),
      startTransaction: jest.fn().mockResolvedValue({}),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      abortTransaction: jest.fn().mockResolvedValue(undefined),
      updateById: jest.fn(),
    } as any;

    productRatingService = {
      getProductRatingStats: jest.fn().mockResolvedValue({
        avgRate: 0,
        totalRatings: 0,
        ratingsSummary: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
      }),
      updateProductRatingStats: jest.fn().mockResolvedValue(undefined),
      recalculateProductRatings: jest.fn().mockResolvedValue({}),
    } as any;

    service = new RatingService(
      ratingRepo as any,
      productRepo as any,
      productRatingService as any
    );
  });

  it('should create rating and update product denorm fields', async () => {
    const userId = '507f1f77bcf86cd799439011';
    const dto: any = { productId: '507f1f77bcf86cd799439012', rating: 5, comment: 'Great' };

    (ratingRepo.findByUserAndProduct as jest.Mock).mockResolvedValue(null);
    (ratingRepo.createOne as jest.Mock).mockResolvedValue({ userId, productId: dto.productId, rating: dto.rating, comment: dto.comment });
    (productRepo.findById as jest.Mock).mockResolvedValue({ avgRate: 4, totalRatings: 1, ratingsSummary: { '4': 1 }, denormComments: [] });
    (productRepo.updateById as jest.Mock).mockResolvedValue(true);

    const res = await service.rateProduct(userId, dto);
    expect(res).toBeDefined();
    expect(productRatingService.updateProductRatingStats).toHaveBeenCalled();
  });

  it('should update existing rating and adjust product denorm', async () => {
    const userId = '507f1f77bcf86cd799439011';
    const dto: any = { productId: '507f1f77bcf86cd799439012', rating: 3, comment: 'Ok' };

    (ratingRepo.findByUserAndProduct as jest.Mock).mockResolvedValue({ userId, productId: dto.productId, rating: 5, comment: 'old' });
    (ratingRepo.updateRating as jest.Mock).mockResolvedValue({ userId, productId: dto.productId, rating: dto.rating, comment: dto.comment });
    (productRepo.findById as jest.Mock).mockResolvedValue({ avgRate: 5, totalRatings: 1, ratingsSummary: { '5': 1 }, denormComments: [] });
    (productRepo.updateById as jest.Mock).mockResolvedValue(true);

    const res = await service.rateProduct(userId, dto);
    expect(res).toBeDefined();
    expect(productRatingService.updateProductRatingStats).toHaveBeenCalled();
  });
});
