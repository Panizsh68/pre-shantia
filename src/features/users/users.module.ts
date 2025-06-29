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
import { RolesModule } from '../roles/roles.module';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';
import {
  IBaseCrudRepository,
  IBaseTransactionRepository,
} from 'src/libs/repository/interfaces/base-repo.interfaces';
import { IUserRepository, UserRepository } from './repositories/user.repository';

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
    RolesModule,
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
    UsersService,
    AuthenticationGuard,
    JwtService,
    TokensService,
  ],
  exports: ['IUsersService'],
})
export class UsersModule {}
