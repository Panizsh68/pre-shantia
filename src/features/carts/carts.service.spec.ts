import { Test, TestingModule } from '@nestjs/testing';
import { CartsService } from './carts.service';
import defaultTestProviders from 'src/test/test-utils';

describe('CartsService', () => {
  let service: CartsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CartsService, ...defaultTestProviders()],
    }).compile();

    service = module.get<CartsService>(CartsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
