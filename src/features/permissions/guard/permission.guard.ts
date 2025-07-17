import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY, PermissionMeta } from '../decoratorss/permissions.decorators';
import { IPermission } from '../interfaces/permissions.interface';
import { Action } from '../enums/actions.enum';
import { Resource } from '../enums/resources.enum';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permissionMeta =
      this.reflector.get<PermissionMeta>(PERMISSION_KEY, context.getHandler()) ||
      this.reflector.get<PermissionMeta>(PERMISSION_KEY, context.getClass());

    if (!permissionMeta) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const hasPermission = user?.permissions?.some((perm: IPermission) => {
      const isAllManage = perm.resource === Resource.ALL && perm.actions.includes(Action.MANAGE);
      const isMatching =
        perm.resource === permissionMeta.resource && perm.actions.includes(permissionMeta.action);
      return isMatching || isAllManage;
    });

    if (!hasPermission) {
      throw new ForbiddenException('Access denied: missing required permission');
    }

    return true;
  }
}
