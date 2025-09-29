import { Controller, Inject, UseGuards, Get, Query, Param, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
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
    const users: User[] = await this.usersService.findAll({ page, perPage, conditions: { createdBy: { $exists: true } } as any });
    // attach profile for each user
    const results = await Promise.all(
      users.map(async (u: User) => {
        const profile = await this.profileService.getByUserId(u.id.toString());
        return {
          id: u.id.toString(),
          phoneNumber: u.phoneNumber,
          nationalId: u.nationalId,
          permissions: u.permissions || [],
          profile: profile || null,
        };
      }),
    );
    return { items: results, total: results.length } as UserListResponseDto;
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
