import { Controller, Post, Body, HttpStatus, HttpCode, Get, Res, UseGuards, Inject, BadRequestException, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthProfileDto } from './dto/auth-profile.dto';
import { IProfileService } from '../users/profile/interfaces/profile.service.interface';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SignUpResponseDto } from './dto/sign-up.response.dto';
import { SignInResponseDto } from './dto/sign-in.response.dto';
import { RequestContext } from 'src/common/decorators/request-context.decorator';
import { RequestContext as ContextType } from 'src/common/types/request-context.interface';
import { TokenPayload } from './interfaces/token-payload.interface';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { IPermission } from '../permissions/interfaces/permissions.interface';
import { Response, Request } from 'express';
import { UserListItemDto } from 'src/features/users/dto/user-list.response.dto';
import { RefreshTokenRequestDto } from './dto/refresh-token.request.dto';
import { Permission } from '../permissions/decorators/permissions.decorators';
import { PermissionsGuard } from '../permissions/guard/permission.guard';
import { Resource } from '../permissions/enums/resources.enum';
import { Action } from '../permissions/enums/actions.enum';
import { AuthenticationGuard } from './guards/auth.guard';
import { IUsersService } from '../users/interfaces/user.service.interface';
import { UpdateUserPermissionsDto } from 'src/features/users/dto/update-user-permissions.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject('IProfileService') private readonly profileService: IProfileService,
    @Inject('IUsersService') private readonly usersService: IUsersService,
  ) { }

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: SignUpResponseDto,
  })
  async signUp(@Body() createUserDto: CreateUserDto): Promise<SignUpResponseDto> {
    return this.authService.signUp(createUserDto);
  }

  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with credentials' })
  @ApiResponse({ status: 200, description: 'User signed in successfully', type: SignInResponseDto })
  async signIn(@Body() signInDto: SignInDto): Promise<SignInResponseDto> {
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
    try {
      // set Authorization header if access token exists
      if (tokens.accessToken) {
        res.setHeader('Authorization', 'Bearer ' + tokens.accessToken);
      }

      // choose secure flag dynamically: true in production or when request is secure
      const req = (res.req as Request);
      const secureFlag = req?.secure || req?.protocol === 'https' || process.env.NODE_ENV === 'production';

      if (tokens.refreshToken) {
        res.cookie('refreshToken', tokens.refreshToken, {
          httpOnly: true,
          secure: !!secureFlag,
          sameSite: 'strict',
          maxAge: 1000 * 60 * 60 * 48,
        });
      }
    } catch (err) {
      // Log but don't throw: avoid crashing the request after successful token generation
       
      console.error('Failed to set headers/cookies in verifyOtp response:', err?.message || err);
    }
    return {
      phoneNumber: verifyOtpDto.phoneNumber,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      profile: tokens.profile
    };
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
    @Body() body: RefreshTokenRequestDto,
    @RequestContext() context: ContextType,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SignUpResponseDto> {
    const reqForCookies = (res.req as Request & { cookies?: Record<string, string> });
    const refreshToken = body.refreshToken || (reqForCookies.cookies && reqForCookies.cookies.refreshToken);
    if (!refreshToken) {throw new BadRequestException('Refresh token not provided');}
    const result = await this.authService.refreshAccessTokenByRefreshToken(refreshToken, context);
    try {
      if (result.accessToken) {
        res.setHeader('Authorization', 'Bearer ' + result.accessToken);
      }
    } catch (err) {
       
      console.error('Failed to set Authorization header in refreshToken response:', err?.message || err);
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
              companyId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            },
          },
        },
        profile: {
          type: 'object',
          properties: {
            phoneNumber: { type: 'string', example: '09123456789' },
            nationalId: { type: 'string', example: '0123456789' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            address: { type: 'string', example: '123 Main St' },
            walletId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            companyId: { type: 'string', example: '507f1f77bcf86cd799439011' }
          }
        }
      },
    },
  })
  async getProfile(
    @CurrentUser() user: TokenPayload,
  ): Promise<{ userId: string; phoneNumber: string; companyId?: string; permissions: IPermission[]; profile: AuthProfileDto }> {
    const permissions =
      Array.isArray(user.permissions) && user.permissions.length > 0
        ? user.permissions
        : [
          { resource: Resource.ORDERS, actions: [Action.CREATE, Action.READ] },
          { resource: Resource.PRODUCTS, actions: [Action.READ] },
          { resource: Resource.RATINGS, actions: [Action.READ, Action.CREATE, Action.UPDATE, Action.DELETE] },
          { resource: Resource.TICKETING, actions: [Action.READ, Action.CREATE] },
          { resource: Resource.TRANSACTION, actions: [Action.READ] },
          { resource: Resource.TRANSPORTING, actions: [Action.READ] },
          { resource: Resource.PROFILE, actions: [Action.READ, Action.CREATE] },
          { resource: Resource.WALLETS, actions: [Action.READ, Action.UPDATE] },
          { resource: Resource.PAYMENT, actions: [Action.CREATE, Action.UPDATE] },
          { resource: Resource.CARTS, actions: [Action.READ, Action.CREATE, Action.UPDATE, Action.DELETE] },
          { resource: Resource.CATEGORIES, actions: [Action.READ] },
          { resource: Resource.COMPANIES, actions: [Action.READ] }
        ];

    const profile = await this.profileService.getByUserId(user.userId);
    const userWithPhone = user as TokenPayload & { phoneNumber?: string };
    const resultProfile: AuthProfileDto = {
      phoneNumber: profile?.phoneNumber || userWithPhone.phoneNumber || '',
      nationalId: profile?.nationalId || '',
      firstName: profile?.firstName,
      lastName: profile?.lastName,
      address: profile?.address,
      walletId: profile?.walletId?.toString(),
      companyId: profile?.companyId?.toString(),
    };
    return {
      userId: user.userId,
      phoneNumber: resultProfile.phoneNumber,
      companyId: resultProfile.companyId,
      permissions,
      profile: resultProfile,
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
    @RequestContext() context: ContextType,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SignUpResponseDto> {
    const result = await this.authService.adminSignUp(signUpDto, context);
    try {
      if (result.accessToken) {
        res.setHeader('Authorization', 'Bearer ' + result.accessToken);
      }

      const req = (res.req as Request);
      const secureFlag = req?.secure || req?.protocol === 'https' || process.env.NODE_ENV === 'production';

      if (result.refreshToken) {
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: !!secureFlag,
          sameSite: 'strict',
          maxAge: 1000 * 60 * 60 * 48,
        });
      }
    } catch (err) {
       
      console.error('Failed to set headers/cookies in adminSignUp response:', err?.message || err);
    }
    return result;
  }

  @Patch('users/:id/permissions')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.USERS, Action.MANAGE)
  @ApiOperation({ summary: "Update a user's permissions" })
  @ApiBody({ type: UpdateUserPermissionsDto })
  @ApiResponse({ status: 200, description: 'Updated user', type: UserListItemDto })
  async setUserPermissions(
    @Param('id') id: string,
    @Body() dto: UpdateUserPermissionsDto,
  ): Promise<UserListItemDto> {
    const updated = await this.usersService.setPermissions(id, dto.permissions);
    // attach profile for response
    const profile = await this.profileService.getByUserId(updated.id.toString());
    return {
      id: updated.id.toString(),
      phoneNumber: updated.phoneNumber,
      nationalId: updated.nationalId,
      permissions: updated.permissions || [],
      profile: profile || null,
    } as UserListItemDto;
  }
}
