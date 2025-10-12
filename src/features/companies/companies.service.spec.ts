import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesService } from './companies.service';
import defaultTestProviders from 'src/test/test-utils';

describe('CompaniesService', () => {
  let service: CompaniesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompaniesService, ...defaultTestProviders()],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
