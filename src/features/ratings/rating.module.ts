import { Module, forwardRef } from '@nestjs/common';
import { PermissionsModule } from 'src/features/permissions/permissions.module';
import { getModelToken } from '@nestjs/mongoose';
import { Rating, RatingSchema } from './entity/rating.entity';
import { RatingController } from './rating.controller';
import { IRatingRepository, RatingRepository } from './repositories/rating.repository';
import { RatingService } from './rating.service';
import { GenericRepositoryModule } from 'src/libs/repository/generic-repository.module';

@Module({
  imports: [GenericRepositoryModule.forFeature<Rating>(Rating.name, Rating, RatingSchema), forwardRef(() => PermissionsModule)],
  controllers: [RatingController],
  providers: [
    {
      provide: 'RatingRepository',
      useFactory: (ratingModel): IRatingRepository => {
        return new RatingRepository(ratingModel);
      },
      inject: [getModelToken(Rating.name)],
    },
    {
      provide: 'IRatingService',
      useClass: RatingService,
    },
  ],
  exports: ['IRatingService', 'RatingRepository'],
})
export class RatingModule { }
