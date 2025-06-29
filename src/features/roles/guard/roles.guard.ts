// guards/role.guard.ts
import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Role } from '../entities/role.entity';
import { Action } from '../enums/actions.enum';
import { PERMISSION_KEY, PermissionMeta } from '../decoratorss/permissions.decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectModel(Role.name) private readonly roleModel: Model<Role>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission: PermissionMeta = this.reflector.getAllAndOverride(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!permission) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as { roles: string[] }; // از گارد auth انتظار می‌ره توکن رو decode کرده باشه

    if (!user || !user.roles || user.roles.length === 0) {
      throw new ForbiddenException('No roles provided');
    }

    const roles = await this.roleModel
      .find({
        name: { $in: user.roles },
      })
      .lean();

    const hasPermission = roles.some(role => {
      return role.permissions.some(p => {
        return (
          (p.resource === permission.resource || p.resource === 'all') &&
          (p.actions.includes(permission.action) || p.actions.includes(Action.MANAGE))
        );
      });
    });

    if (!hasPermission) {
      throw new ForbiddenException('Access denied: insufficient permissions');
    }

    return true;
  }
}
