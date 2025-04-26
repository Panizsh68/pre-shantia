import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { AuthenticationGuard } from './auth/guards/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { ProfileModule } from './profile/profile.module';
import { UserRepository } from './repositories/user.repository';

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
      useClass: UserRepository,
    },
    UsersService,  AuthenticationGuard, JwtService, TokensService],
})
export class UsersModule {}
