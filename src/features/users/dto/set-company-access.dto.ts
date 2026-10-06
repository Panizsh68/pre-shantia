import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsMongoId, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PermissionDto } from 'src/features/permissions/dto/permission.dto';

/**
 * Replaces a user's permissions for one company and optionally makes the user
 * an administrator of that company. Permissions are always scoped to the
 * company supplied here; this endpoint never creates global permissions.
 */
export class SetCompanyAccessDto {
  @ApiProperty({ description: 'Company ObjectId', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  companyId: string;

  @ApiProperty({ type: [PermissionDto], description: 'Permissions scoped to the selected company. Send an empty array to revoke company permissions.' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  permissions: PermissionDto[];

  @ApiProperty({ description: 'Whether the user is an administrator of the selected company', example: true })
  @IsBoolean()
  isCompanyAdmin: boolean;
}
