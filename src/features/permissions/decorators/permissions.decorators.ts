// decorators/permission.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Resource } from '../enums/resources.enum';
import { Action } from '../enums/actions.enum';

export const PERMISSION_KEY = 'permission';

export interface PermissionMeta {
  resource: Resource;
  action: Action;
}

export const Permission = (resource: Resource, action: Action) =>
  SetMetadata(PERMISSION_KEY, { resource, action });
