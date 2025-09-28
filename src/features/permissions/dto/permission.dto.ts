import { IsEnum, IsArray, IsOptional, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Action } from '../enums/actions.enum';
import { Resource } from '../enums/resources.enum';

export class PermissionDto {
  @ApiProperty({ description: 'Resource name for the permission', example: Resource.CARTS })
  @IsEnum(Resource)
  resource: Resource;

  @ApiProperty({ description: 'Allowed actions for the resource', example: [Action.READ, Action.MANAGE] })
  @IsArray()
  @IsEnum(Action, { each: true })
  actions: Action[];

  @ApiPropertyOptional({ description: 'Optional company id to scope the permission', example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsMongoId()
  companyId?: string;
}
