import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { AuthModule } from './auth/auth.module';
import { AuthenticationGuard } from './auth/guards/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { TokensService } from 'src/utils/services/tokens/tokens.service';

@Module({
  imports: [MongooseModule.forFeature([
    {
      name: User.name,
      schema: UserSchema
    }
  ]), AuthModule
  ],
  controllers: [UsersController],
  providers: [UsersService,  AuthenticationGuard, JwtService, TokensService],
})
export class UsersModule {}
