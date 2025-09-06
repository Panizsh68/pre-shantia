import {
  Injectable,
  ConflictException,
  NotFoundException,
  HttpException,
  HttpStatus,
  Inject,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { TokenPayload } from './interfaces/token-payload.interface';
import { ShahkarService } from 'src/utils/services/shahkar/shahkar.service';
import { OtpService } from 'src/utils/services/otp/otp.service';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { CachingService } from 'src/infrastructure/caching/caching.service';
import { SignUpDto } from './dto/sign-up.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { SignInDto } from './dto/sign-in.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { TokenType } from 'src/utils/services/tokens/tokentype.enum';
import { IUsersService } from '../users/interfaces/user.service.interface';
import { IProfileService } from '../users/profile/interfaces/profile.service.interface';
import { IWalletService } from '../wallets/interfaces/wallet.service.interface';
import { SignUpResponseDto } from './dto/sign-up.response.dto';
import { SignInResponseDto } from './dto/signn-in.response.dto';
import { ConfigService } from '@nestjs/config';
import { IAuthRepository } from './repositories/auth.repository';
import { RequestContext } from 'src/common/types/request-context.interface';
import { Resource } from '../permissions/enums/resources.enum';
import { Action } from '../permissions/enums/actions.enum';
import { IPermission } from '../permissions/interfaces/permissions.interface';

import { VerifyOtpResponse } from './interfaces/auth-response.interface';

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
    @Inject('IWalletsService') private readonly walletsService: IWalletService,
    @Inject('AuthRepository') private readonly authRepository: IAuthRepository,
  ) { }

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
  ): Promise<VerifyOtpResponse> {
    console.log(`Starting OTP verification for phoneNumber=${verifyOtpDto.phoneNumber}`);
    try {
      const validOtp = await this.otpService.verifyOtp(
        verifyOtpDto.phoneNumber,
        verifyOtpDto.otp,
      );

      if (!validOtp) {
        console.warn(`Invalid or expired OTP for phoneNumber=${verifyOtpDto.phoneNumber}`);
        throw new HttpException('Invalid or expired OTP', HttpStatus.BAD_REQUEST);
      }

      console.debug(`OTP validated successfully for phoneNumber=${verifyOtpDto.phoneNumber}`);

      const signUpData = await this.cacheService.get<{ phoneNumber: string; nationalId: string }>(
        `signup:${verifyOtpDto.phoneNumber}`,
      );

      let user = await this.usersService.findUserByPhoneNumber(verifyOtpDto.phoneNumber);

      if (!user) {
        console.log(`User not found in DB for phoneNumber=${verifyOtpDto.phoneNumber}. Checking sign-up cache.`);
        if (!signUpData) {
          console.error(
            `No sign-up data found in cache for phoneNumber=${verifyOtpDto.phoneNumber}`,
          );
          throw new HttpException('User not found and no sign-up data', HttpStatus.BAD_REQUEST);
        }

        const isSuperAdmin =
          signUpData.nationalId === this.configService.get<string>('SUPERADMIN_MELICODE') &&
          signUpData.phoneNumber === this.configService.get<string>('SUPERADMIN_PHONE');

        const permissions = isSuperAdmin
          ? [
            { resource: Resource.ALL, actions: [Action.MANAGE] },
            // پرمیشن‌های ویژه برای کیف پول ادمین به عنوان شرکت واسطه
            {
              resource: Resource.WALLETS, actions: [
                Action.READ,
                Action.UPDATE,
                Action.deposit_intermediary,
                Action.deposit_company,
                Action.deposit_user
              ]
            }
          ]
          : [
            { resource: Resource.ORDERS, actions: [Action.CREATE, Action.READ] },
            { resource: Resource.PRODUCTS, actions: [Action.READ] },
            { resource: Resource.RATINGS, actions: [Action.READ, Action.CREATE, Action.UPDATE, Action.DELETE] },
            { resource: Resource.TICKETING, actions: [Action.READ, Action.CREATE] },
            { resource: Resource.TRANSACTION, actions: [Action.READ] },
            { resource: Resource.TRANSPORTING, actions: [Action.READ] },
            { resource: Resource.PROFILE, actions: [Action.READ, Action.CREATE] },
            { resource: Resource.WALLETS, actions: [Action.READ, Action.UPDATE, Action.deposit_intermediary] },
            { resource: Resource.PAYMENT, actions: [Action.CREATE, Action.UPDATE] },
            { resource: Resource.CARTS, actions: [Action.READ, Action.CREATE, Action.UPDATE, Action.DELETE] },
            { resource: Resource.CATEGORIES, actions: [Action.READ] },
            { resource: Resource.COMPANIES, actions: [Action.READ] }
          ];

        const session = await this.authRepository.startTransaction();
        try {
          const userCreateInput = {
            phoneNumber: signUpData.phoneNumber,
            nationalId: signUpData.nationalId,
            permissions,
          };
          console.log(`Creating new user with phoneNumber=${signUpData.phoneNumber}`);
          user = await this.usersService.create(userCreateInput, session);
          console.log(`User created successfully with ID=${user.id}`);

          const { WalletOwnerType } = await import('../wallets/enums/wallet-ownertype.enum');
          const { determineOwnerTypeFromPermissions } = await import('../../utils/wallet-owner.util');
          // تعیین نوع کیف پول بر اساس پرمیشن‌های کاربر
          const ownerType = determineOwnerTypeFromPermissions(permissions);
          const wallet = await this.walletsService.createWallet({
            ownerId: user.id.toString(),
            ownerType,
            balance: 0,
            currency: 'IRR',
          });
          console.log(`Wallet created for user ID=${user.id}, wallet ID=${wallet.id}`);

          // ایجاد پروفایل برای کاربر جدید
          const profile = await this.profileService.create({
            phoneNumber: signUpData.phoneNumber,
            nationalId: signUpData.nationalId
          }, session);

          // آپدیت پروفایل با wallet ID
          await this.profileService.update(profile.id, { walletId: wallet.id });
          console.log(`Profile created with ID=${profile.id} for user ID=${user.id} and linked to wallet ID=${wallet.id}`);

          await this.authRepository.commitTransaction(session);
          console.log(`Transaction committed for user creation, clearing signup cache.`);
          await this.cacheService.delete(`signup:${verifyOtpDto.phoneNumber}`);
        } catch (error) {
          await this.authRepository.abortTransaction(session);
          console.error(
            `Transaction aborted during user creation for phoneNumber=${verifyOtpDto.phoneNumber}: ${error.message}`,
            error.stack,
          );
          throw new HttpException(
            'Failed to create user or profile',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      } else {
        console.log(`User found for phoneNumber=${verifyOtpDto.phoneNumber}, proceeding to token generation.`);
      }

      // Always use user.permissions as assigned (no fallback to old default)
      const userPermissions = Array.isArray(user.permissions) && user.permissions.length > 0
        ? user.permissions
        : [];

      const payload: TokenPayload = {
        userId: user.id.toString(),
        permissions: userPermissions,
        tokenType: TokenType.access,
      };

      console.debug(`Generating access token for user ID=${user.id}`);
      const accessToken = await this.tokensService.getAccessToken(payload);

      const refreshPayload: TokenPayload = { ...payload, tokenType: TokenType.refresh };
      console.debug(`Generating refresh token for user ID=${user.id}`);
      const refreshToken = await this.tokensService.getRefreshToken(refreshPayload);

      await this.cacheService.set(
        `refresh-info:${refreshToken}`,
        { ip: context.ip, userAgent: context.userAgent, userId: user.id.toString() },
        this.configService.get<number>('JWT_REFRESH_EXPIRES') || 48 * 3600,
      );
      console.log(`Refresh token session info cached for user ID=${user.id}`);

      // Get user profile
      const profile = await this.profileService.getByUserId(user.id.toString());

      return {
        accessToken,
        refreshToken,
        profile: {
          phoneNumber: profile?.phoneNumber || user.phoneNumber,
          nationalId: profile?.nationalId || signUpData?.nationalId || user.nationalId || '',
          firstName: profile?.firstName,
          lastName: profile?.lastName,
          address: profile?.address,
          walletId: profile?.walletId?.toString()
        }
      };
    } catch (error) {
      if (error instanceof HttpException) {
        console.warn(`HttpException in verifyOtp: ${error.message}`);
        throw error;
      }
      console.error(`Unexpected error in verifyOtp: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to verify OTP. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async refreshAccessTokenByRefreshToken(
    refreshToken: string,
    context: RequestContext,
  ): Promise<{ accessToken: string }> {
    console.log(`Refreshing access token with refreshToken=${refreshToken.slice(0, 6)}...`);
    try {
      const payload = await this.tokensService.validateRefreshToken(refreshToken, context);

      const sessionInfo = await this.cacheService.get<RefreshSessionInfo>(
        `refresh-info:${refreshToken}`,
      );
      if (!sessionInfo) {
        console.warn(`Refresh token session not found or expired for token=${refreshToken.slice(0, 6)}...`);
        throw new UnauthorizedException('Refresh token revoked or expired');
      }
      if (sessionInfo.ip !== context.ip || sessionInfo.userAgent !== context.userAgent) {
        console.warn(`Session context mismatch for refresh token=${refreshToken.slice(0, 6)}...`);
        throw new UnauthorizedException('Session context mismatch');
      }

      const user = await this.usersService.findOne(payload.userId);
      if (!user) {
        console.warn(`User not found for ID=${payload.userId} during refresh token`);
        throw new NotFoundException('User not found');
      }

      const userPermissions = Array.isArray(user.permissions) && user.permissions.length > 0
        ? user.permissions
        : [
          { resource: Resource.ORDERS, actions: [Action.CREATE, Action.READ] },
          { resource: Resource.PRODUCTS, actions: [Action.READ] },
          { resource: Resource.RATINGS, actions: [Action.READ, Action.CREATE, Action.UPDATE, Action.DELETE] },
          { resource: Resource.TICKETING, actions: [Action.READ, Action.CREATE] },
          { resource: Resource.TRANSACTION, actions: [Action.READ] },
          { resource: Resource.TRANSPORTING, actions: [Action.READ] },
          { resource: Resource.PROFILE, actions: [Action.READ, Action.CREATE] },
          { resource: Resource.WALLETS, actions: [Action.READ, Action.UPDATE, Action.deposit_user] },
          { resource: Resource.PAYMENT, actions: [Action.CREATE, Action.UPDATE] },
          { resource: Resource.CARTS, actions: [Action.READ, Action.CREATE, Action.UPDATE, Action.DELETE] },
          { resource: Resource.CATEGORIES, actions: [Action.READ] },
          { resource: Resource.COMPANIES, actions: [Action.READ] }
        ];

      console.debug(`Generating new access token for user ID=${user.id}`);
      const accessToken = await this.tokensService.getAccessToken({
        userId: user.id.toString(),
        permissions: userPermissions,
        tokenType: TokenType.access,
      });

      return { accessToken };
    } catch (error) {
      if (error instanceof HttpException) {
        console.warn(`HttpException in refreshAccessTokenByRefreshToken: ${error.message}`);
        throw error;
      }
      console.error(`Unexpected error in refreshAccessTokenByRefreshToken: ${error.message}`, error.stack);
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
      // فقط پروفایل کاربر حذف شود، نه خود یوزر
      await this.profileService.deleteByUserId(userId);
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
