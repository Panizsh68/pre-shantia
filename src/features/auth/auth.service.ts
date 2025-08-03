import {
  Injectable,
  ConflictException,
  NotFoundException,
  HttpException,
  HttpStatus,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { ShahkarService } from 'src/utils/services/shahkar/shahkar.service';
import { OtpService } from 'src/utils/services/otp/otp.service';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { CachingService } from 'src/infrastructure/caching/caching.service';
import { SignUpDto } from './dto/sign-up.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { SignInDto } from './dto/sign-in.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { TokenPayload } from './interfaces/token-payload.interface';
import { TokenType } from 'src/utils/services/tokens/tokentype.enum';
import { IUsersService } from '../users/interfaces/user.service.interface';
import { IProfileService } from '../users/profile/interfaces/profile.service.interface';
import { SignUpResponseDto } from './dto/sign-up.response.dto';
import { SignInResponseDto } from './dto/signn-in.response.dto';
import { ConfigService } from '@nestjs/config';
import { IAuthRepository } from './repositories/auth.repository';
import { RequestContext } from 'src/common/types/request-context.interface';
import { Resource } from '../permissions/enums/resources.enum';
import { Action } from '../permissions/enums/actions.enum';
import { IPermission } from '../permissions/interfaces/permissions.interface';

interface RefreshSessionInfo {
  ip: string;
  userAgent: string;
  userId: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject('IUsersService') private readonly usersService: IUsersService,
    private readonly shahkarService: ShahkarService,
    private readonly otpService: OtpService,
    private readonly tokensService: TokensService,
    private readonly cacheService: CachingService,
    private readonly configService: ConfigService,
    @Inject('IProfileService') private readonly profileService: IProfileService,
    @Inject('AuthRepository') private readonly authRepository: IAuthRepository,
  ) {}

  async signUp(createUserDto: CreateUserDto): Promise<SignUpResponseDto> {
    try {
      const exists = await this.usersService.findUserByPhoneNumber(createUserDto.phoneNumber);
      if (exists) throw new ConflictException('User already exists');

      const valid = await this.shahkarService.verifyMelicodeWithPhonenumber(
        createUserDto.nationalId,
        createUserDto.phoneNumber,
      );
      if (!valid) throw new HttpException('Phone and National ID mismatch', HttpStatus.BAD_REQUEST);

      const ttl = this.configService.get<number>('app.OTP_TTL') ?? 300;
      await this.cacheService.set(
        `signup:${createUserDto.phoneNumber}`,
        {
          phoneNumber: createUserDto.phoneNumber,
          nationalId: createUserDto.nationalId,
        },
        ttl,
      );

      await this.otpService.sendOtpToPhone(createUserDto.phoneNumber);
      return { phoneNumber: createUserDto.phoneNumber };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to sign up. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async signIn(signInDto: SignInDto): Promise<SignInResponseDto> {
    try {
      const user = await this.usersService.findUserByPhoneNumber(signInDto.phoneNumber);
      if (!user) throw new NotFoundException('User not found');
      await this.otpService.sendOtpToPhone(signInDto.phoneNumber);
      return { phoneNumber: signInDto.phoneNumber };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to sign in. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async verifyOtp(
    verifyOtpDto: VerifyOtpDto,
    context: RequestContext,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const validOtp = await this.otpService.verifyOtp(verifyOtpDto.phoneNumber, verifyOtpDto.otp);
      if (!validOtp) throw new HttpException('Invalid or expired OTP', HttpStatus.BAD_REQUEST);

      let signUpData = await this.cacheService.get<{ phoneNumber: string; nationalId: string }>(
        `signup:${verifyOtpDto.phoneNumber}`,
      );

      let user = await this.usersService.findUserByPhoneNumber(verifyOtpDto.phoneNumber);

      if (!user) {
        if (!signUpData) {
          throw new HttpException('User not found and no sign-up data', HttpStatus.BAD_REQUEST);
        }

        const isSuperAdmin =
          signUpData.nationalId === this.configService.get<string>('SUPERADMIN_MELICODE') &&
          signUpData.phoneNumber === this.configService.get<string>('SUPERADMIN_PHONE');

        const permissions = isSuperAdmin
          ? [{ resource: Resource.ALL, actions: [Action.MANAGE] }]
          : [];

        const session = await this.authRepository.startTransaction();
        try {
          const userCreateInput: any = {
            phoneNumber: signUpData.phoneNumber,
            nationalId: signUpData.nationalId,
          };
          if (isSuperAdmin) {
            userCreateInput.permissions = permissions;
          }
          console.log('🚀 Creating user with:', userCreateInput);
          user = await this.usersService.create(userCreateInput, session);
          console.log('✅ User created:', user);
          await this.authRepository.commitTransaction(session);
          await this.cacheService.delete(`signup:${verifyOtpDto.phoneNumber}`);
        } catch (error) {
          console.error('❌ Error during user creation:', error);
          await this.authRepository.abortTransaction(session);
          throw new HttpException(
            'Failed to create user or profile',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }

      // generate tokens
      const payload: TokenPayload = {
        userId: user.id.toString(),
        permissions: user.permissions || [],
        tokenType: TokenType.access,
      };

      const accessToken = await this.tokensService.getAccessToken(payload);

      const refreshPayload: TokenPayload = { ...payload, tokenType: TokenType.refresh };
      const refreshToken = await this.tokensService.getRefreshToken(refreshPayload);

      // ذخیره امن refreshToken با context (ip و userAgent) توی کش برای اعتبارسنجی بعدی
      await this.cacheService.set(
        `refresh-info:${refreshToken}`,
        { ip: context.ip, userAgent: context.userAgent, userId: user.id.toString() },
        this.configService.get<number>('JWT_REFRESH_EXPIRES') || 48 * 3600,
      );

      return { accessToken, refreshToken };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to verify OTP. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ۴. تمدید access token با اعتبارسنجی refresh token
  async refreshAccessTokenByRefreshToken(
    refreshToken: string,
    context: RequestContext,
  ): Promise<{ accessToken: string }> {
    try {
      const payload = await this.tokensService.validateRefreshToken(refreshToken, context);

      // بررسی وجود session در کش
      const sessionInfo = await this.cacheService.get<RefreshSessionInfo>(
        `refresh-info:${refreshToken}`,
      );
      if (!sessionInfo) throw new UnauthorizedException('Refresh token revoked or expired');
      if (sessionInfo.ip !== context.ip || sessionInfo.userAgent !== context.userAgent)
        throw new UnauthorizedException('Session context mismatch');

      const user = await this.usersService.findOne(payload.userId);
      if (!user) throw new NotFoundException('User not found');

      const accessToken = await this.tokensService.getAccessToken({
        userId: user.id.toString(),
        permissions: user.permissions || [],
        tokenType: TokenType.access,
      });

      return { accessToken };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to refresh access token. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ۵. خروج از سیستم (ری‌ووک refresh token)
  async signOut(userId: string, refreshToken?: string): Promise<{ message: string }> {
    try {
      if (refreshToken) {
        await this.cacheService.delete(`refresh-info:${refreshToken}`);
      }
      await this.cacheService.delete(`permissions:${userId}`);
      return { message: 'Signed out successfully' };
    } catch (error) {
      throw new HttpException(
        'Failed to sign out. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ۶. ثبت‌نام ادمین با پرمیشن مستقیم (بدون OTP)
  async adminSignUp(signUpDto: SignUpDto): Promise<SignUpResponseDto> {
    try {
      const exists = await this.usersService.findUserByPhoneNumber(signUpDto.phoneNumber);
      if (exists) throw new ConflictException('User already exists');

      // اطمینان از پرمیشن‌ها فقط توسط ادمین تنظیم شده
      const user = await this.usersService.create(signUpDto);

      // generate tokens for created user
      const payload: TokenPayload = {
        userId: user.id.toString(),
        permissions: user.permissions || [],
        tokenType: TokenType.access,
      };
      const accessToken = await this.tokensService.getAccessToken(payload);
      const refreshPayload: TokenPayload = { ...payload, tokenType: TokenType.refresh };
      const refreshToken = await this.tokensService.getRefreshToken(refreshPayload);

      // store refreshToken session for future validation
      await this.cacheService.set(
        `refresh-info:${refreshToken}`,
        { ip: '', userAgent: '', userId: user.id.toString() },
        this.configService.get<number>('JWT_REFRESH_EXPIRES') || 48 * 3600,
      );

      return { phoneNumber: user.phoneNumber, accessToken, refreshToken };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to sign up admin. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // پروفایل و پرمیشن های کاربر فعلی
  async getProfile(user: TokenPayload): Promise<{ userId: string; permissions: IPermission[] }> {
    try {
      return { userId: user.userId, permissions: user.permissions };
    } catch (error) {
      throw new HttpException('Failed to get profile.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
