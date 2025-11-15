import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import defaultTestProviders from 'src/test/test-utils';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        ...defaultTestProviders(),
        {
          provide: 'DatabaseConnection',
          useValue: { readyState: 1 },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLiveness', () => {
    it('should return ok: true', async () => {
      const result = await controller.getLiveness();
      expect(result.ok).toBe(true);
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('getReadiness', () => {
    it('should check all components', async () => {
      const result = await controller.getReadiness();
      expect(result).toHaveProperty('ok');
      expect(result).toHaveProperty('mongo');
      expect(result).toHaveProperty('cache');
      expect(result).toHaveProperty('redis');
      expect(result).toHaveProperty('config');
      expect(result).toHaveProperty('jwt');
    });
  });

  describe('getHealth', () => {
    it('should return ok: true (alias for liveness)', async () => {
      const result = await controller.getHealth();
      expect(result.ok).toBe(true);
      expect(result.timestamp).toBeDefined();
    });
  });
});
