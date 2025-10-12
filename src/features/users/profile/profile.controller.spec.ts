import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import defaultTestProviders from 'src/test/test-utils';
import { ProfileService } from './profile.service';

describe('ProfileController', () => {
  let controller: ProfileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [ProfileService, ...defaultTestProviders()],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
