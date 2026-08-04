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
      expect(result.status).toBe('ok');
    });
  });

  describe('getReadiness', () => {
    it('should check all components', async () => {
      const result = await controller.getReadiness();
      expect(result).toHaveProperty('ok');
      expect(result).toHaveProperty('checks.mongo');
      expect(result).toHaveProperty('checks.cache');
      expect(result).toHaveProperty('checks.redis');
      expect(result).toHaveProperty('checks.jwt');
      expect(JSON.stringify(result)).not.toMatch(/MONGO_URL|REDIS_PASSWORD|JWT_SECRET|config|stack|message/i);
    });
  });

  describe('getHealth', () => {
    it('should return ok: true (alias for liveness)', async () => {
      const result = await controller.getHealth();
      expect(result.status).toBe('ok');
    });
  });
});
