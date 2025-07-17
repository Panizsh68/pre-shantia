import { IsEnum, IsArray } from 'class-validator';
import { Action } from '../enums/actions.enum';
import { Resource } from '../enums/resources.enum';

export class PermissionDto {
  @IsEnum(Resource)
  resource: Resource;

  @IsArray()
  @IsEnum(Action, { each: true })
  actions: Action[];
}
