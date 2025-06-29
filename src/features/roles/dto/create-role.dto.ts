import { ArrayUnique, IsEnum, IsString, ValidateNested } from 'class-validator';
import { Resource } from '../enums/resources.enum';
import { Action } from '../enums/actions.enum';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class Permission {
  @ApiProperty({
    enum: Resource,
    example: Resource.PRODUCTS,
  })
  @IsEnum(Resource)
  resource: Resource;

  @ApiProperty({
    type: [String],
    enum: Action,
    example: [Action.READ, Action.UPDATE],
  })
  @IsEnum(Action, { each: true })
  @ArrayUnique()
  actions: Action[];
}

export class CreateRoleDto {
  @ApiProperty({
    example: 'admin',
  })
  @IsString()
  name: string;

  @ApiProperty({
    type: [Permission],
  })
  @ValidateNested({ each: true })
  @Type(() => Permission)
  permissions: Permission[];
}
