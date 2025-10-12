import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import defaultTestProviders from 'src/test/test-utils';

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService, ...defaultTestProviders()],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
