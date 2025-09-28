import { CreateUserDto } from '../../users/dto/create-user.dto';
import { IPermission } from 'src/features/permissions/interfaces/permissions.interface';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PermissionDto } from 'src/features/permissions/dto/permission.dto';
import { IsArray, ValidateNested, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class SignUpDto extends CreateUserDto {
  @ApiPropertyOptional({
    description: 'List of user permissions',
    example: [
      { resource: 'carts', actions: ['r', 'm'] },
      { resource: 'orders', actions: ['r'] },
      // scoped permission example:
      { resource: 'products', actions: ['c'], companyId: '507f1f77bcf86cd799439011' },
    ],
    type: 'array',
    items: { $ref: '#/components/schemas/PermissionDto' },
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  permissions?: PermissionDto[];

  @ApiPropertyOptional({
    description: 'Company id to assign the user to (optional, used by admin signup)',
    type: String,
  })
  @IsString()
  @IsOptional()
  companyId?: string;
}
