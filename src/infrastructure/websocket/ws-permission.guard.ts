import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { WS_PERMISSIONS_KEY } from "./ws-permissions.decorator";
import { Permission } from "src/features/users/auth/interfaces/permission.interface";

@Injectable()
export class WsPermissionGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean  {
        const permissions = this.reflector.get<Permission[]>(WS_PERMISSIONS_KEY, context.getHandler())

        if (!permissions || !permissions.length) return true

        const client = context.switchToWs().getClient()
        const user = client.data?.user
        const userPermissions = user?.permissions

        const hasPermission = permissions.every(required => 
            userPermissions.some(
                perm => perm.action === required.action && perm.resource === required.resource
            )
        )

        if (!hasPermission) throw new ForbiddenException('Insufficient permissions')
        return true
    }
}