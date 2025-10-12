import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import defaultTestProviders from 'src/test/test-utils';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        ...defaultTestProviders(),
        {
          provide: 'DatabaseConnection',
          useValue: { readyState: 1 },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
