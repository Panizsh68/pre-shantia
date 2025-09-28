import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { AuthenticationGuard } from '../auth/guards/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { ProfileModule } from './profile/profile.module';
import { Model } from 'mongoose';
import { IUserRepository, UserRepository } from './repositories/user.repository';
import { CachingService } from 'src/infrastructure/caching/caching.service';
import { PermissionsModule } from 'src/features/permissions/permissions.module';
import { CompaniesModule } from 'src/features/companies/companies.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
    forwardRef(() => AuthModule),
    ProfileModule,
    forwardRef(() => PermissionsModule),
    forwardRef(() => CompaniesModule),
  ],
  controllers: [UsersController],
  providers: [
    {
      provide: 'UserRepository',
      useFactory: (userModel: Model<User>): IUserRepository => {
        return new UserRepository(userModel);
      },
      inject: [getModelToken(User.name)],
    },
    {
      provide: 'IUsersService',
      useClass: UsersService,
    },
    AuthenticationGuard,
    JwtService,
    TokensService,
    CachingService,
  ],
  exports: ['IUsersService'],
})
export class UsersModule { }
