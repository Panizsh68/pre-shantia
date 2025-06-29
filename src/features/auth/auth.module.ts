import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { ShahkarService } from 'src/utils/services/shahkar/shahkar.service';
import { ShahkarModule } from 'src/utils/services/shahkar/shahkar.module';
import { OtpModule } from 'src/utils/services/otp/otp.module';
import { OtpService } from 'src/utils/services/otp/otp.service';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { JwtService } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { RefreshToken, RefreshTokenSchema } from './schemas/refresh-token.schema';
import { CachingService } from 'src/infrastructure/caching/caching.service';
import { ProfileModule } from '../users/profile/profile.module';
import { RolesModule } from '../roles/roles.module';
import { BaseTransactionRepository } from 'src/libs/repository/base-repos';
import { User, UserSchema } from '../users/entities/user.entity';
import { AuthRepository, IAuthRepository } from './repositories/auth.repository';
import { Model } from 'mongoose';
import { IBaseTransactionRepository } from 'src/libs/repository/interfaces/base-repo.interfaces';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: RefreshToken.name,
        schema: RefreshTokenSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),

    ShahkarModule,
    OtpModule,
    ProfileModule,
    RolesModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: 'AuthRepository',
      useFactory: (authModel: Model<User>): IAuthRepository => {
        return new AuthRepository(authModel);
      },
      inject: [getModelToken(User.name)],
    },
    AuthService,
    ShahkarService,
    OtpService,
    TokensService,
    JwtService,
    CachingService,
  ],
})
export class AuthModule {}
