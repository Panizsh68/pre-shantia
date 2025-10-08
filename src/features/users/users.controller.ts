import { Controller, Inject, UseGuards, Get, Query, Param, ParseIntPipe, DefaultValuePipe, BadRequestException } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { AuthProfileDto } from 'src/features/auth/dto/auth-profile.dto';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { IUsersService } from './interfaces/user.service.interface';
import { User } from './entities/user.entity';
import { AuthenticationGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from 'src/features/permissions/guard/permission.guard';
import { Permission } from 'src/features/permissions/decorators/permissions.decorators';
import { Resource } from 'src/features/permissions/enums/resources.enum';
import { Action } from 'src/features/permissions/enums/actions.enum';
import { IProfileService } from './profile/interfaces/profile.service.interface';
import { Profile } from './profile/entities/profile.entity';
import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UserListResponseDto } from './dto/user-list.response.dto';
import { UserDetailResponseDto } from './dto/user-detail.response.dto';

@ApiTags('users')
@UseGuards(AuthenticationGuard)
@Controller('users')
export class UsersController {
  constructor(
    @Inject('IUsersService') private readonly usersService: IUsersService,
    @Inject('IProfileService') private readonly profileService: IProfileService,
    private readonly configService: ConfigService,
  ) { }

  @Get()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.ALL, Action.MANAGE)
  @ApiOperation({ summary: 'List all users (super-admin only)' })
  @ApiQuery({ name: 'skip', required: false, example: 0 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiResponse({ status: 200, description: 'List of users', type: UserListResponseDto })
  async listUsers(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip = 0,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ) {
    const perPage = Math.max(1, limit);
    const page = Math.floor(skip / perPage) + 1;
    const conditions: FilterQuery<User> = { createdBy: { $exists: true } } as unknown as FilterQuery<User>;
    const users: User[] = await this.usersService.findAll({ page, perPage, conditions });
    // attach profile for each user
    const results = await Promise.all(
      users.map(async (u: User) => {
        const profile = await this.profileService.getByUserId(u.id.toString());
        const profileDto: AuthProfileDto | undefined = profile
          ? {
            phoneNumber: profile.phoneNumber,
            nationalId: profile.nationalId,
            firstName: profile.firstName,
            lastName: profile.lastName,
            address: profile.address,
            walletId: profile.walletId?.toString(),
          }
          : undefined;
        return {
          id: u.id.toString(),
          phoneNumber: u.phoneNumber,
          nationalId: u.nationalId,
          permissions: u.permissions || [],
          profile: profileDto,
        };
      }),
    );
    const response: UserListResponseDto = { items: results, total: results.length };
    return response;
  }

  @Get('created-by-super')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.ALL, Action.MANAGE)
  @ApiOperation({ summary: 'List users created by the super-admin' })
  @ApiQuery({ name: 'skip', required: false, example: 0 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiResponse({ status: 200, description: 'List of users created by super-admin', type: UserListResponseDto })
  async listUsersCreatedBySuper(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip = 0,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ) {
    const superPhone = this.configService.get<string>('SUPERADMIN_PHONE');
    const superMelicode = this.configService.get<string>('SUPERADMIN_MELICODE');
    if (!superPhone || !superMelicode) {
      throw new BadRequestException('SUPERADMIN_PHONE or SUPERADMIN_MELICODE not configured');
    }

    // try to find the super-admin user by phone and verify national id
    const superAdmin = await this.usersService.findUserByPhoneNumber(superPhone);
    if (!superAdmin || superAdmin.nationalId !== superMelicode) {
      // no super-admin present in DB
      const empty: UserListResponseDto = { items: [], total: 0 };
      return empty;
    }

    const perPage = Math.max(1, limit);
    const page = Math.floor(skip / perPage) + 1;
    const conditions: FilterQuery<User> = { createdBy: superAdmin.id } as FilterQuery<User>;
    const users: User[] = await this.usersService.findAll({ page, perPage, conditions });
    const results = await Promise.all(
      users.map(async (u: User) => {
        const profile = await this.profileService.getByUserId(u.id.toString());
        const profileDto: AuthProfileDto | undefined = profile
          ? {
            phoneNumber: profile.phoneNumber,
            nationalId: profile.nationalId,
            firstName: profile.firstName,
            lastName: profile.lastName,
            address: profile.address,
            walletId: profile.walletId?.toString(),
          }
          : undefined;
        return {
          id: u.id.toString(),
          phoneNumber: u.phoneNumber,
          nationalId: u.nationalId,
          permissions: u.permissions || [],
          profile: profileDto,
        };
      }),
    );
    const response: UserListResponseDto = { items: results, total: results.length };
    return response;
  }

  @Get(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.ALL, Action.MANAGE)
  @ApiOperation({ summary: "Get a user's details and profile (super-admin only)" })
  @ApiResponse({ status: 200, description: 'User detail', type: UserDetailResponseDto })
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    const profile = await this.profileService.getByUserId(id);
    return {
      id: user.id.toString(),
      phoneNumber: user.phoneNumber,
      nationalId: user.nationalId,
      permissions: user.permissions || [],
      profile: profile || null,
    };
  }
}
