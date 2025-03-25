import { ConflictException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../schemas/user.schema';
import { Model } from 'mongoose';
import { UsersService } from '../users.service';
import { ShahkarService } from 'src/utils/services/shahkar/shahkar.service';
import { OtpService } from 'src/utils/services/otp/otp.service';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { TokenType } from 'src/utils/services/tokens/tokentype.enum';
import { RefreshToken } from './schemas/refresh-token.schema';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(RefreshToken.name) private refreshTokenSchema: Model<RefreshToken>,
    private readonly usersService: UsersService,
    private readonly shahkarService: ShahkarService,
    private readonly otpService: OtpService,
    private readonly tokensService: TokensService,
    private readonly configService: ConfigService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    const isUserExist = await this.usersService.findUserByPhoneNumber(signUpDto.phoneNumber)
    if (isUserExist) throw new ConflictException('user already exists')
    
      // Check if the user is the superadmin
    const isSuperAdmin = 
    signUpDto.phoneNumber === this.configService.get('SUPERADMIN_PHONE') &&
    signUpDto.meliCode === this.configService.get('SUPERADMIN_MELICODE');

    if (!isSuperAdmin && signUpDto.permissions) {
      throw new HttpException('You are not authorized to assign permissions', HttpStatus.FORBIDDEN);
    }
    // shahkar api to check wether phoneNumber matches with the meliCode
     const validatedUser = await this.shahkarService.verifyMelicodeWithPhonenumber(
      signUpDto.meliCode, 
      signUpDto.phoneNumber
    )
    // if (!validatedUser) throw new HttpException('phoneNumber and meliCode aren not matched', HttpStatus.BAD_REQUEST)
    // send otp code to phoneNumber
     const sendOtp = this.otpService.sendOtpToPhone(signUpDto.phoneNumber)
     return { message: 'OTP sent successfully', phoneNumber: signUpDto.phoneNumber };
  }

  async signIn(signInDto: SignInDto) {
    const user = await this.usersService.findUserByPhoneNumber(signInDto.phoneNumber)
    // console.log(user)
    if (!user) {
      throw new NotFoundException('user does not exists')
    }
    // send otp code to phoneNumber
    const sendOtp = this.otpService.sendOtpToPhone(signInDto.phoneNumber)
    return { message: 'OTP sent successfully', phoneNumber: signInDto.phoneNumber }; 
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto, metadata: { userAgent: string; ip: string }, res: Response) {
    const isOtpValid = await this.otpService.verifyOtp(verifyOtpDto.phoneNumber, verifyOtpDto.otp)
    if (!isOtpValid) throw new HttpException('otp is not valid', HttpStatus.BAD_REQUEST)
    let user = await this.usersService.findUserByPhoneNumber(verifyOtpDto.phoneNumber)
  
    if (!user) {
      const {otp, ...signUpDto} = verifyOtpDto
      user = await this.usersService.createUser(signUpDto)
    }

    // Check if the user is the superadmin and allow them to pass permissions to other users
    const isSuperAdmin = 
    verifyOtpDto.phoneNumber === this.configService.get('SUPERADMIN_PHONE') &&
    verifyOtpDto.meliCode === this.configService.get('SUPERADMIN_MELICODE');
  
    // Restrict non-superadmins from passing permissions
    if (isSuperAdmin) {
      if (verifyOtpDto.permissions) {
        // If superadmin is present and permissions are provided, update the user's permissions
        user.permissions = verifyOtpDto.permissions;
      }
    } else if (verifyOtpDto.permissions) {
      // If the user is not a superadmin and attempts to pass permissions, throw an error
      throw new HttpException('You are not authorized to assign permissions', HttpStatus.FORBIDDEN);
    }

    const tokens = await this.generateTokens(user, metadata, res)
    return { message: 'OTP verified successfully', user , tokens};
  }

  private async generateTokens(user: User, metadata: { userAgent: string, ip: string }, res: Response) {

    const accessTokenPayload = {
      userId: user._id,
      permissions: user.permissions, 
      userAgent: metadata.userAgent,
      ip: metadata.ip,
      tokenType: TokenType.access
    };
  
    console.log("Final token payload:", accessTokenPayload);

    const refreshTokenPayload = {
      userId: user._id,
      tokenType: TokenType.refresh
    }

    const accessToken = await this.tokensService.getAccessToken(accessTokenPayload)
    const refreshToken = await this.tokensService.getRefreshToken(refreshTokenPayload)

    await this.refreshTokenSchema.create({
      userId: user._id,
      token: refreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
    })
     
    if (res) {
      res.setHeader('Authorization', `${accessToken}`),
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: this.configService.get('NODE_ENV') === 'production',
        sameSite: 'strict',
        expires: new Date(Date.now() + 48 * 60 * 60 * 1000),
      });
    }
    return accessToken;
  }
}
