import { ApiProperty } from '@nestjs/swagger';
import { UserListItemDto } from './user-list.response.dto';
import { AuthProfileDto } from 'src/features/auth/dto/auth-profile.dto';

export class UserDetailResponseDto extends UserListItemDto {
  @ApiProperty({ description: 'Full profile information', type: AuthProfileDto })
  profile: AuthProfileDto;
}

