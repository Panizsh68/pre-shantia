import { Controller, Post, Body, HttpStatus, HttpCode, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SignUpResponseDto } from './dto/sign-up.response.dto';
import { SignInResponseDto } from './dto/signn-in.response.dto';
import { VerifyOtpResponseDto } from './dto/verify-otp.response.dto';
import { RequestContext } from 'src/common/decorators/request-context.decorator';
import { RequestContext as ContextType } from 'src/common/types/request-context.interface';
import { TokenPayload } from './interfaces/token-payload.interface';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { IPermission } from '../permissions/interfaces/permissions.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto): Promise<SignUpResponseDto> {
    return this.authService.signUp(signUpDto);
  }

  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() signInDto: SignInDto): Promise<SignInResponseDto> {
    return this.authService.signIn(signInDto);
  }

  @Public()
  @Post('verify-otp')
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @RequestContext() context: ContextType,
  ): Promise<VerifyOtpResponseDto> {
    return this.authService.verifyOtp(verifyOtpDto, context);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() body: { refreshToken: string },
    @RequestContext() context: ContextType,
  ): Promise<{ accessToken: string }> {
    return this.authService.refreshAccessTokenByRefreshToken(body.refreshToken, context);
  }

  @Post('signout')
  @HttpCode(HttpStatus.OK)
  async signOut(
    @RequestContext() context: ContextType,
    @CurrentUser() user: TokenPayload,
  ): Promise<{ message: string }> {
    return this.authService.signOut(user.userId);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getProfile(
    @CurrentUser() user: TokenPayload,
  ): Promise<{ userId: string; permissions: IPermission[] }> {
    return {
      userId: user.userId,
      permissions: user.permissions,
    };
  }
}
