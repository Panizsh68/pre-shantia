import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import defaultTestProviders from 'src/test/test-utils';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, ...defaultTestProviders()],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
