import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Profile, ProfileSchema } from './entities/profile.entity';
import { Model } from 'mongoose';
import { IBaseCrudRepository } from 'src/libs/repository/interfaces/base-repo.interfaces';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';

@Module({
  imports: [MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchema }])],
  controllers: [ProfileController],
  providers: [
    ProfileService,
    {
      provide: 'ProfileRepository',
      useFactory: (profileModel: Model<Profile>): IBaseCrudRepository<Profile> => {
        return new BaseCrudRepository(profileModel);
      },
      inject: [getModelToken(Profile.name)],
    },
    {
      provide: 'IProfileService',
      useClass: ProfileService,
    },
  ],
  exports: ['IProfileService', 'ProfileRepository'],
})
export class ProfileModule {}
