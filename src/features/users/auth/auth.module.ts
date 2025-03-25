import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, UserSchema } from '../schemas/user.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from '../users.service';
import { RefreshToken, RefreshTokenSchema } from './schemas/refresh-token.schema';
import { ShahkarService } from 'src/utils/services/shahkar/shahkar.service';
import { ShahkarModule } from 'src/utils/services/shahkar/shahkar.module';
import { OtpModule } from 'src/utils/services/otp/otp.module';
import { OtpService } from 'src/utils/services/otp/otp.service';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { JwtService } from '@nestjs/jwt';
import { UsersModule } from '../users.module';

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
  providers: [AuthService, UsersService, ShahkarService, OtpService, TokensService, JwtService],
})
export class AuthModule {}
