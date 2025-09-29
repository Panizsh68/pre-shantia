import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthProfileDto } from 'src/features/auth/dto/auth-profile.dto';
import { IPermission } from 'src/features/permissions/interfaces/permissions.interface';

export class UserListItemDto {
  @ApiProperty({ description: 'User id (ObjectId string)', example: '68d94bffebbe4333cc7f8f03' })
  id: string;

  @ApiProperty({ description: 'Phone number of the user', example: '+989123456789' })
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'National id (meli code)', example: '2284280072' })
  nationalId?: string;

  @ApiPropertyOptional({ description: 'Assigned permissions for the user', type: [Object], example: [{ resource: 'users', actions: ['r'] }] })
  permissions?: IPermission[];

  @ApiPropertyOptional({ description: "User's profile (if available)", type: AuthProfileDto })
  profile?: AuthProfileDto;
}

export class UserListResponseDto {
  @ApiProperty({ description: 'List of users', type: [UserListItemDto] })
  items: UserListItemDto[];

  @ApiPropertyOptional({ description: 'Total number of users (when known)', example: 123 })
  total?: number;
}

