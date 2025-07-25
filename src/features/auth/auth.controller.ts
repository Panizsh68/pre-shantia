import { Controller, Post, Body, HttpStatus, HttpCode, Get, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SignUpResponseDto } from './dto/sign-up.response.dto';
import { SignInResponseDto } from './dto/signn-in.response.dto';
import { RequestContext } from 'src/common/decorators/request-context.decorator';
import { RequestContext as ContextType } from 'src/common/types/request-context.interface';
import { TokenPayload } from './interfaces/token-payload.interface';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { IPermission } from '../permissions/interfaces/permissions.interface';
import { Response } from 'express';
import { Permission } from '../permissions/decoratorss/permissions.decorators';
import { PermissionsGuard } from '../permissions/guard/permission.guard';
import { Resource } from '../permissions/enums/resources.enum';
import { Action } from '../permissions/enums/actions.enum';
import { AuthenticationGuard } from './guards/auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: SignUpResponseDto,
  })
  async signUp(@Body() createUserDto: CreateUserDto): Promise<SignUpResponseDto> {
    // فقط ثبت نام و ارسال OTP، هیچ توکنی ست نمیشه
    return this.authService.signUp(createUserDto);
  }

  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with credentials' })
  @ApiResponse({ status: 200, description: 'User signed in successfully', type: SignInResponseDto })
  async signIn(@Body() signInDto: SignInDto): Promise<SignInResponseDto> {
    // فقط ارسال OTP، هیچ توکنی ست نمیشه
    return this.authService.signIn(signInDto);
  }

  @Public()
  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP code' })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
    type: SignUpResponseDto,
  })
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @RequestContext() context: ContextType,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SignUpResponseDto> {
    const tokens = await this.authService.verifyOtp(verifyOtpDto, context);
    if (tokens.accessToken) {
      res.setHeader('Authorization', 'Bearer ' + tokens.accessToken);
    }
    if (tokens.refreshToken) {
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 48,
      });
    }
    return { phoneNumber: verifyOtpDto.phoneNumber, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using a refresh token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: { type: 'string', example: 'your-refresh-token' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'New access token generated',
    type: SignUpResponseDto,
  })
  async refreshToken(
    @Body() body: { refreshToken?: string },
    @RequestContext() context: ContextType,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SignUpResponseDto> {
    const refreshToken = body.refreshToken || (res.req.cookies && res.req.cookies.refreshToken);
    if (!refreshToken) throw new Error('Refresh token not provided');
    const result = await this.authService.refreshAccessTokenByRefreshToken(refreshToken, context);
    if (result.accessToken) {
      res.setHeader('Authorization', 'Bearer ' + result.accessToken);
    }
    // refresh فقط accessToken میده، پس refreshToken رو برنمیگردونیم
    return { phoneNumber: '', accessToken: result.accessToken };
  }

  @Post('signout')
  @UseGuards(AuthenticationGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign out user and invalidate refresh token' })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Successfully signed out' },
      },
    },
  })
  async signOut(
    @RequestContext() context: ContextType,
    @CurrentUser() user: TokenPayload,
    @Body('refreshToken') refreshToken?: string,
    @Res({ passthrough: true }) res?: Response,
  ): Promise<{ message: string }> {
    // حذف کوکی refreshToken سمت کلاینت
    if (res) {
      res.clearCookie('refreshToken');
    }
    return this.authService.signOut(user.userId, refreshToken);
  }

  @Get('me')
  @UseGuards(AuthenticationGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user profile and permissions' })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: '123456789' },
        permissions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource: { type: 'string', example: 'orders' },
              actions: {
                type: 'array',
                items: { type: 'string', example: 'r' },
              },
            },
          },
        },
      },
    },
  })
  async getProfile(
    @CurrentUser() user: TokenPayload,
  ): Promise<{ userId: string; permissions: IPermission[] }> {
    return {
      userId: user.userId,
      permissions: user.permissions,
    };
  }

  @Post('admin-signup')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.USERS, Action.MANAGE)
  @ApiOperation({ summary: 'Admin creates a user with permissions' })
  @ApiResponse({
    status: 201,
    description: 'User with permissions created successfully',
    type: SignUpResponseDto,
  })
  async adminSignUp(
    @Body() signUpDto: SignUpDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SignUpResponseDto> {
    const result = await this.authService.adminSignUp(signUpDto);
    if (result.accessToken) {
      res.setHeader('Authorization', 'Bearer ' + result.accessToken);
    }
    if (result.refreshToken) {
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 48,
      });
    }
    return result;
  }
}
