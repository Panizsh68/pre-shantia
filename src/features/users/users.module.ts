import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { AuthenticationGuard } from './auth/guards/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { ProfileModule } from './profile/profile.module';
import { UserRepository } from './repositories/user.repository';
import { Model } from 'mongoose';

@Module({
  imports: [MongooseModule.forFeature([
    {
      name: User.name,
      schema: UserSchema
    }
  ]), AuthModule, ProfileModule
  ],
  controllers: [UsersController],
  providers: [
    {
      provide: 'UserRepository',
      useFactory: (userModel: Model<User>) => {
        return new UserRepository(userModel);
      }, 
      inject: [getModelToken(User.name)],
    },
    UsersService, AuthenticationGuard, JwtService, TokensService],
})
export class UsersModule {}
