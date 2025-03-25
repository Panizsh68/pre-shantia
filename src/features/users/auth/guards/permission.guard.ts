import {
    CanActivate,
    ExecutionContext,
    Injectable,
    ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import { Permission } from "../interfaces/permission.interface";
import { Reflector } from "@nestjs/core";
import { TokensService } from "src/utils/services/tokens/tokens.service";
import { Resource } from "../enums/resources.enum";
import { Action } from "../enums/actions.enum";

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private tokensService: TokensService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.get<Permission[]>(
            PERMISSIONS_KEY,
            context.getHandler()
        );

        if (!requiredPermissions?.length) {
            return true; // Allow access if no permissions are required
        }

        const request = context.switchToHttp().getRequest<Request>();
        const token = request.headers.authorization?.split(" ")[1];

        if (!token) {
            throw new ForbiddenException("No authorization token found");
        }

        const decodedToken = await this.tokensService.validate(token);
        const rawPermissions = decodedToken?.permissions;

        if (!rawPermissions) {
            throw new ForbiddenException("User permissions not found in token");
        }

        let userPermissions: Permission[];

        try {
            userPermissions = Array.isArray(rawPermissions)
                ? rawPermissions
                : JSON.parse(rawPermissions);

            if (!Array.isArray(userPermissions)) {
                throw new Error();
            }

            userPermissions.forEach((perm) => {
                if (!perm?.resource || !perm?.action) {
                    throw new ForbiddenException(`Invalid permission format: ${JSON.stringify(perm)}`);
                }
                if (!Object.values(Resource).includes(perm.resource as Resource) ||
                    !Object.values(Action).includes(perm.action as Action)) {
                    throw new ForbiddenException(`Invalid permission: ${JSON.stringify(perm)}`);
                }
            });
        } catch {
            throw new ForbiddenException("Invalid permissions format in token");
        }

        const hasPermission = requiredPermissions.every((required) =>
            userPermissions.some(
                (userPerm) =>
                    userPerm.action === required.action &&
                    userPerm.resource === required.resource
            )
        );

        if (!hasPermission) {
            throw new ForbiddenException("You do not have permission to perform this action");
        }

        return true;
    }
}
