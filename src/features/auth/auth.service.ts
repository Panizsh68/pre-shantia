import {
  Injectable,
  ConflictException,
  NotFoundException,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ShahkarService } from 'src/utils/services/shahkar/shahkar.service';
import { OtpService } from 'src/utils/services/otp/otp.service';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { CachingService } from 'src/infrastructure/caching/caching.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { TokenPayload } from './interfaces/token-payload.interface';
import { TokenType } from 'src/utils/services/tokens/tokentype.enum';
import { CreateProfileDto } from '../users/profile/dto/create-profile.dto';
import { IUsersService } from '../users/interfaces/user.service.interface';
import { IProfileService } from '../users/profile/interfaces/profile.service.interface';
import { User } from '../users/entities/user.entity';
import { SignUpResponseDto } from './dto/sign-up.response.dto';
import { SignInResponseDto } from './dto/signn-in.response.dto';
import { VerifyOtpResponseDto } from './dto/verify-otp.response.dto';
import { ConfigService } from '@nestjs/config';
import { IAuthRepository } from './repositories/auth.repository';
import { RequestContext } from 'src/common/types/request-context.interface';

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

  async signUp(signUpDto: SignUpDto): Promise<SignUpResponseDto> {
    const existingUser = await this.usersService.findUserByPhoneNumber(signUpDto.phoneNumber);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const isValid = await this.shahkarService.verifyMelicodeWithPhonenumber(
      signUpDto.nationalId,
      signUpDto.phoneNumber,
    );
    if (!isValid) {
      throw new HttpException('Phone number and National ID do not match', HttpStatus.BAD_REQUEST);
    }

    const ttl = this.configService.get<number>('app.OTP_TTL') ?? 300;
    await this.cacheService.set(`signup:${signUpDto.phoneNumber}`, signUpDto, ttl);
    await this.otpService.sendOtpToPhone(signUpDto.phoneNumber);
    return { phoneNumber: signUpDto.phoneNumber };
  }

  async signIn(signInDto: SignInDto): Promise<SignInResponseDto> {
    const user = await this.usersService.findUserByPhoneNumber(signInDto.phoneNumber);
    if (!user) {
      throw new NotFoundException('User does not exist');
    }

    await this.otpService.sendOtpToPhone(signInDto.phoneNumber);
    return { phoneNumber: signInDto.phoneNumber };
  }

  async verifyOtp(
    verifyOtpDto: VerifyOtpDto,
    context: RequestContext,
  ): Promise<VerifyOtpResponseDto> {
    const isOtpValid = await this.otpService.verifyOtp(verifyOtpDto.phoneNumber, verifyOtpDto.otp);
    if (!isOtpValid) {
      throw new HttpException('Invalid or expired OTP', HttpStatus.BAD_REQUEST);
    }

    const cachedSignUpDto = await this.cacheService.get<SignUpDto>(
      `signup:${verifyOtpDto.phoneNumber}`,
    );
    if (!cachedSignUpDto) {
      throw new HttpException(
        'No sign-up data found. Please sign up first.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const session = await this.authRepository.startTransaction();
    try {
      const user = await this.usersService.create(
        {
          phoneNumber: cachedSignUpDto.phoneNumber,
          nationalId: cachedSignUpDto.nationalId,
        },
        session,
      );

      const createProfileDto: CreateProfileDto = {
        phoneNumber: user.phoneNumber,
        nationalId: cachedSignUpDto.nationalId,
      };
      await this.profileService.create(createProfileDto, session);
      await this.usersService.assignRole(user.id, 'user', session);
      await this.authRepository.commitTransaction(session);
      await this.cacheService.delete(`signup:${verifyOtpDto.phoneNumber}`);

      return this.generateTokens(user, context);
    } catch (error) {
      await this.authRepository.abortTransaction(session);
      throw error;
    }
  }

  async refreshAccessTokenByRefreshToken(
    refreshToken: string,
    context: RequestContext,
  ): Promise<{ accessToken: string }> {
    const payload = await this.tokensService.validateRefreshToken(refreshToken, context);
    const user = await this.usersService.findOne(payload.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const accessToken = await this.generateAccessToken(user);
    return { accessToken };
  }

  async signOut(userId: string): Promise<{ message: string }> {
    await this.cacheService.delete(`permissions:${userId}`);
    return { message: 'Signed out successfully' };
  }

  private async generateTokens(
    user: User,
    context: RequestContext,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const roles = await this.usersService.getUserRoles(user.id.toString());
    const basePayload = {
      userId: user.id.toString(),
      roles,
    };

    const accessToken = await this.tokensService.getAccessToken({
      ...basePayload,
      tokenType: TokenType.access,
    });
    const refreshToken = await this.tokensService.getRefreshToken({
      ...basePayload,
      tokenType: TokenType.refresh,
    });

    await this.cacheService.set(
      `refresh-info:${refreshToken}`,
      {
        ip: context.ip,
        userAgent: context.userAgent,
        userId: user.id.toString(),
      },
      60 * 60 * 48,
    );

    return { accessToken, refreshToken };
  }

  private async generateAccessToken(user: User): Promise<string> {
    const roles = await this.usersService.getUserRoles(user.id.toString());
    const payload: TokenPayload = {
      userId: user.id.toString(),
      roles,
      tokenType: TokenType.access,
    };
    return this.tokensService.getAccessToken(payload);
  }
}
