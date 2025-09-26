import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Profile, ProfileSchema } from './entities/profile.entity';
import { Model } from 'mongoose';
import { IProfileRepository, ProfileRepository } from './repositories/profille.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchema }])],
  controllers: [ProfileController],
  providers: [
    {
      provide: 'ProfileRepository',
      useFactory: (profileModel: Model<Profile>): IProfileRepository => {
        return new ProfileRepository(profileModel);
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
export class ProfileModule { }
