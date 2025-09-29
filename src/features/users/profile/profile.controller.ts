import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Inject,
  Get,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { Permission } from 'src/features/permissions/decorators/permissions.decorators';
import { PermissionsGuard } from 'src/features/permissions/guard/permission.guard';
import { Resource } from 'src/features/permissions/enums/resources.enum';
import { Action } from 'src/features/permissions/enums/actions.enum';
import { ProfileService } from './profile.service';
import { AuthenticationGuard } from 'src/features/auth/guards/auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from './entities/profile.entity';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { TokenPayload } from 'src/features/auth/interfaces/token-payload.interface';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('profile')
export class ProfileController {
  constructor(
    @Inject('IProfileService') private readonly profileService: ProfileService,
  ) { }



  @Get()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.PROFILE, Action.READ)
  @ApiOperation({ summary: 'Get current user profile', description: 'This route is open for default users.' })
  @ApiResponse({ status: 200, description: 'User profile', type: Profile })
  async getMyProfile(@CurrentUser() user: TokenPayload): Promise<Profile> {
    const profile = await this.profileService.getByUserId(user.userId);
    if (!profile) {
      throw new NotFoundException(`Profile for user ${user.userId} not found`);
    }
    return profile;
  }

  @Patch(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.PROFILE, Action.UPDATE)
  @ApiOperation({ summary: 'Update profile by ID', description: 'This route is open for default users.' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated', type: Profile })
  async update(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    return this.profileService.update(id, updateProfileDto);
  }


}
