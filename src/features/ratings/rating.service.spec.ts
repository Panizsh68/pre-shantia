import { RatingService } from './rating.service';
import { IRatingRepository } from './repositories/rating.repository';
import { IProductRepository } from 'src/features/products/repositories/product.repository';
import { toPlain } from 'src/libs/repository/utils/doc-mapper';

describe('RatingService (unit)', () => {
  let service: RatingService;
  let ratingRepo: Partial<IRatingRepository>;
  let productRepo: Partial<IProductRepository>;

  beforeEach(() => {
    ratingRepo = {
      findByUserAndProduct: jest.fn(),
      createOne: jest.fn(),
      saveOne: jest.fn(),
    } as any;

    productRepo = {
      findById: jest.fn(),
      startTransaction: jest.fn().mockResolvedValue({}),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      abortTransaction: jest.fn().mockResolvedValue(undefined),
      updateById: jest.fn(),
    } as any;

    service = new RatingService(ratingRepo as any, productRepo as any);
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
    expect(productRepo.updateById).toHaveBeenCalled();
  });

  it('should update existing rating and adjust product denorm', async () => {
    const userId = '507f1f77bcf86cd799439011';
    const dto: any = { productId: '507f1f77bcf86cd799439012', rating: 3, comment: 'Ok' };

    (ratingRepo.findByUserAndProduct as jest.Mock).mockResolvedValue({ userId, productId: dto.productId, rating: 5, comment: 'old' });
    (ratingRepo.saveOne as jest.Mock).mockResolvedValue({ userId, productId: dto.productId, rating: dto.rating, comment: dto.comment });
    (productRepo.findById as jest.Mock).mockResolvedValue({ avgRate: 5, totalRatings: 1, ratingsSummary: { '5': 1 }, denormComments: [] });
    (productRepo.updateById as jest.Mock).mockResolvedValue(true);

    const res = await service.rateProduct(userId, dto);
    expect(res).toBeDefined();
    expect(productRepo.updateById).toHaveBeenCalled();
  });
});
