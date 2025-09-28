import { ApiProperty } from '@nestjs/swagger';
import { PermissionDto } from 'src/features/permissions/dto/permission.dto';
import { IsArray, ArrayNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserPermissionsDto {
  @ApiProperty({ type: [PermissionDto], description: 'List of permissions to assign to the user' })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  permissions: PermissionDto[];
}
