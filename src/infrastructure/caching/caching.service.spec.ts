import { Test, TestingModule } from '@nestjs/testing';
import { CachingService } from './caching.service';
import defaultTestProviders from 'src/test/test-utils';
import { InjectRedis } from '@nestjs-modules/ioredis';

describe('CachingService', () => {
  let service: CachingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CachingService,
        ...defaultTestProviders(),
        // ioredis module inject token (used by InjectRedis decorator)
        {
          provide: 'default_IORedisModuleConnectionToken',
          useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn(), call: jest.fn(), eval: jest.fn(), status: 'ok' },
        },
      ],
    }).compile();

    service = module.get<CachingService>(CachingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
