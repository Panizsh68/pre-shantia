import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY, PermissionMeta } from '../decorators/permissions.decorators';
import { PermissionsService } from '../permissions.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly permissionsService: PermissionsService) { }

  canActivate(context: ExecutionContext): boolean {
    const permissionMeta =
      this.reflector.get<PermissionMeta>(PERMISSION_KEY, context.getHandler()) ||
      this.reflector.get<PermissionMeta>(PERMISSION_KEY, context.getClass());

    if (!permissionMeta) {return true;}

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // allow guard to consider an optional companyId in the request body/query/params
    let companyId = request.body?.companyId || request.params?.companyId || request.query?.companyId || undefined;

    if (!companyId && user?.permissions) {
      const perm = user.permissions.find(p => p.resource === permissionMeta.resource && p.actions.includes(permissionMeta.action));
      companyId = perm?.companyId;
    }
    return this.permissionsService.hasPermission(user?.permissions, permissionMeta.resource, permissionMeta.action, companyId);
  }
}
