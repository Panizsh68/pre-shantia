import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
  Inject,
  UnauthorizedException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { RedactingLogger } from 'src/infrastructure/logging/redacting-logger';
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
import { CreateProfileDto } from '../users/profile/dto/create-profile.dto';
import { IWalletService } from '../wallets/interfaces/wallet.service.interface';
import { SignUpResponseDto } from './dto/sign-up.response.dto';
import { SignInResponseDto } from './dto/sign-in.response.dto';
import { ConfigService } from '@nestjs/config';
import { IAuthRepository } from './repositories/auth.repository';
import { RequestContext } from 'src/common/types/request-context.interface';
import { Resource } from '../permissions/enums/resources.enum';
import { Action } from '../permissions/enums/actions.enum';
import { IPermission } from '../permissions/interfaces/permissions.interface';
import { determineOwnerTypeFromPermissions } from 'src/utils/wallet-owner.util';
import { User } from '../users/entities/user.entity';

import { VerifyOtpResponse } from './interfaces/auth-response.interface';

interface RefreshSessionInfo {
  ip: string;
  userAgent: string;
  userId: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new RedactingLogger(AuthService.name);

  constructor(
    @Inject('IUsersService') private readonly usersService: IUsersService,
    @Inject('ICompanyService') private readonly companiesService: import('../companies/interfaces/company.service.interface').ICompanyService,
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
    const startTime = Date.now();
    this.logger.log(`[signUp] START for ${createUserDto.phoneNumber}`);
    try {
      const exists = await this.usersService.findUserByPhoneNumber(createUserDto.phoneNumber);
      if (exists) {
        await this.otpService.sendOtpToPhone(createUserDto.phoneNumber);
        return { phoneNumber: createUserDto.phoneNumber };
      }

      let valid = true;
      try {
        valid = await this.shahkarService.verifyMelicodeWithPhonenumber(
          createUserDto.nationalId,
          createUserDto.phoneNumber,
        );
      } catch (error) {
        // Identity verification is a security gate. Never turn a Shahkar
        // outage into an implicit approval of an unverified identity.
        if (error instanceof HttpException) throw error;
        this.logger.error(`[signUp] Shahkar verification failed: ${error instanceof Error ? error.message : String(error)}`);
        throw new ServiceUnavailableException('Identity verification is temporarily unavailable');
      }
      if (!valid) {
        throw new BadRequestException('Phone and National ID mismatch');
      }

      const ttl = this.configService.get<number>('OTP_TTL') ?? 300;
      const signupSessionStored = await this.cacheService.set(
        `signup:${createUserDto.phoneNumber}`,
        {
          phoneNumber: createUserDto.phoneNumber,
          nationalId: createUserDto.nationalId,
        },
        ttl,
      );
      if (!signupSessionStored) {
        throw new ServiceUnavailableException('Authentication session store is unavailable');
      }

      // Trigger OTP send - the provider now has a safety timeout to avoid stalling the request
      this.logger.debug(`[signUp] Triggering SMS...`);
      await this.otpService.sendOtpToPhone(createUserDto.phoneNumber);
      
      this.logger.log(`[signUp] SUCCESS in ${Date.now() - startTime}ms`);
      return { phoneNumber: createUserDto.phoneNumber };
    } catch (error) {
      this.logger.error(`Signup failed in ${Date.now() - startTime}ms: ${error.message}`);
      if (error instanceof HttpException) { throw error; }
      throw new HttpException(
        error.message || 'Failed to sign up.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async signIn(signInDto: SignInDto): Promise<SignInResponseDto> {
    try {
      const user = await this.usersService.findUserByPhoneNumber(signInDto.phoneNumber);
      if (!user) {
        throw new NotFoundException('این شماره در سامانه ثبت نشده است. لطفاً ابتدا عضو شوید.');
      }

      await this.otpService.sendOtpToPhone(signInDto.phoneNumber);

      return { phoneNumber: signInDto.phoneNumber };
    } catch (error) {
      this.logger.error(`Signin failed: ${error.message}`);
      if (error instanceof HttpException) { throw error; }
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto, context: RequestContext): Promise<VerifyOtpResponse> {
    this.logger.log(`[verifyOtp] Attempt for ${verifyOtpDto.phoneNumber}`);
    try {
      const validOtp = await this.otpService.verifyOtp(
        verifyOtpDto.phoneNumber,
        verifyOtpDto.otp,
      );

      if (!validOtp) {
        throw new HttpException('Invalid or expired OTP', HttpStatus.BAD_REQUEST);
      }

      const signUpData = await this.cacheService.get<{ phoneNumber: string; nationalId: string }>(
        `signup:${verifyOtpDto.phoneNumber}`,
      );

      let user = await this.usersService.findUserByPhoneNumber(verifyOtpDto.phoneNumber);

      if (!user) {
        if (!signUpData) {
          throw new HttpException('No sign-up session found. Please sign up again.', HttpStatus.BAD_REQUEST);
        }

        const isSuperAdmin =
          signUpData.nationalId === this.configService.get<string>('SUPERADMIN_MELICODE') &&
          signUpData.phoneNumber === this.configService.get<string>('SUPERADMIN_PHONE');

        const permissions = isSuperAdmin
          ? [{ resource: Resource.ALL, actions: [Action.MANAGE] }]
          : [
            { resource: Resource.ORDERS, actions: [Action.CREATE, Action.READ] },
            { resource: Resource.RATINGS, actions: [Action.READ, Action.CREATE] },
            { resource: Resource.TICKETING, actions: [Action.READ, Action.CREATE] },
            { resource: Resource.TRANSACTION, actions: [Action.READ] },
            { resource: Resource.PAYMENT, actions: [Action.CREATE] },
            { resource: Resource.PROFILE, actions: [Action.READ, Action.UPDATE] },
            { resource: Resource.WALLETS, actions: [Action.READ, Action.UPDATE] },
            { resource: Resource.CARTS, actions: [Action.READ, Action.CREATE, Action.UPDATE] },
            { resource: Resource.CATEGORIES, actions: [Action.READ] },
            { resource: Resource.COMPANIES, actions: [Action.READ] }
          ];

        const session = await this.authRepository.startTransaction();
        try {
          user = await this.usersService.create({
            phoneNumber: signUpData.phoneNumber,
            nationalId: signUpData.nationalId,
            permissions,
          } as any, session, { createProfile: false });

          const ownerType = determineOwnerTypeFromPermissions(permissions);
          const wallet = await this.walletsService.createWallet({
            ownerId: user.id.toString(),
            ownerType,
            balance: 0,
            currency: 'IRR'
          }, session);

          await this.profileService.create({
            phoneNumber: signUpData.phoneNumber,
            nationalId: signUpData.nationalId,
            walletId: wallet.id,
            userId: user.id.toString(),
          } as any, session);

          await this.authRepository.commitTransaction(session);
          await this.cacheService.delete(`signup:${verifyOtpDto.phoneNumber}`);
        } catch (error) {
          await this.authRepository.abortTransaction(session);
          throw error;
        }
      }

      const payload: TokenPayload = {
        userId: user.id.toString(),
        permissions: user.permissions || [],
        tokenType: TokenType.access,
      };

      const accessToken = await this.tokensService.getAccessToken(payload);
      const refreshToken = await this.tokensService.getRefreshToken({ ...payload, tokenType: TokenType.refresh });

      const refreshSessionStored = await this.cacheService.set(
        `refresh-info:${refreshToken}`,
        { ip: context.ip, userAgent: context.userAgent, userId: user.id.toString() }, 
        Number(this.configService.get<string>('JWT_REFRESH_TTL_SECONDS') || 48 * 3600),
      );
      if (!refreshSessionStored) {
        throw new ServiceUnavailableException('Authentication session store is unavailable');
      }

      const profile = await this.profileService.getByUserId(user.id.toString());

      return {
        accessToken,
        refreshToken,
        profile: {
          phoneNumber: profile?.phoneNumber || user.phoneNumber,
          nationalId: profile?.nationalId || user.nationalId || '',
          firstName: profile?.firstName,
          lastName: profile?.lastName,
          address: profile?.address,
          walletId: profile?.walletId?.toString()
        }
      };
    } catch (error) {
      this.logger.error(`OTP verification failed: ${error.message}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async refreshAccessTokenByRefreshToken(refreshToken: string, context: RequestContext): Promise<{ accessToken: string }> {
    try {
      const payload = await this.tokensService.validateRefreshToken(refreshToken, context);
      const sessionInfo = await this.cacheService.getStrict<RefreshSessionInfo>(`refresh-info:${refreshToken}`);
      
      if (!sessionInfo) {
        throw new UnauthorizedException({
          message: 'Session mismatch',
          code: 'AUTH_SESSION_INVALID',
        });
      }

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
      this.logger.error(`Refresh failed: ${error instanceof Error ? error.message : String(error)}`);
      throw new ServiceUnavailableException('Authentication session store is unavailable');
    }
  }

  async signOut(userId: string, refreshToken?: string): Promise<{ message: string }> {
    // Invalidate all access tokens issued before this logout before deleting
    // the refresh session. The guard checks this version on every request.
    await this.tokensService.bumpAuthVersion(userId);
    if (refreshToken) await this.cacheService.delete(`refresh-info:${refreshToken}`);
    await this.cacheService.delete(`permissions:${userId}`);
    return { message: 'Signed out successfully' };
  }

  async adminSignUp(signUpDto: SignUpDto, context?: RequestContext): Promise<SignUpResponseDto> {
    try {
      const user = await this.usersService.create(signUpDto as any, undefined, { createProfile: true });
      const payload: TokenPayload = {
        userId: user.id.toString(),
        permissions: user.permissions || [],
        tokenType: TokenType.access,
      };
      const accessToken = await this.tokensService.getAccessToken(payload);
      const refreshToken = await this.tokensService.getRefreshToken({ ...payload, tokenType: TokenType.refresh });

      const refreshSessionStored = await this.cacheService.set(
        `refresh-info:${refreshToken}`,
        { ip: context?.ip || '', userAgent: context?.userAgent || '', userId: user.id.toString() }, 
        Number(this.configService.get<string>('JWT_REFRESH_TTL_SECONDS') || 48 * 3600),
      );
      if (!refreshSessionStored) {
        throw new ServiceUnavailableException('Authentication session store is unavailable');
      }

      return { phoneNumber: user.phoneNumber, accessToken, refreshToken };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
