import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, UserSchema } from '../entities/user.entity';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { UsersService } from '../users.service';
import { RefreshToken, RefreshTokenSchema } from './schemas/refresh-token.schema';
import { ShahkarService } from 'src/utils/services/shahkar/shahkar.service';
import { ShahkarModule } from 'src/utils/services/shahkar/shahkar.module';
import { OtpModule } from 'src/utils/services/otp/otp.module';
import { OtpService } from 'src/utils/services/otp/otp.service';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../repositories/user.repository';
import { Model } from 'mongoose';

@Module({
  imports: [ 
    MongooseModule.forFeature([
      {
        name: RefreshToken.name,
        schema: RefreshTokenSchema
      },
      {
        name: User.name,
        schema: UserSchema
      },
    ]),
    ShahkarModule, OtpModule,
  ],
  controllers: [AuthController],
  providers: [
      {
        provide: 'UserRepository',
        useFactory: (userModel: Model<User>) => {
          return new UserRepository(userModel);
        }, 
        inject: [getModelToken(User.name)],
      },
    AuthService, UsersService, ShahkarService, OtpService, TokensService, JwtService,],
})
export class AuthModule {}
