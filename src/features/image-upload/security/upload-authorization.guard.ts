import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { TokenPayload } from 'src/features/auth/interfaces/token-payload.interface';
import { Action } from 'src/features/permissions/enums/actions.enum';
import { Resource } from 'src/features/permissions/enums/resources.enum';

@Injectable()
export class UploadAuthorizationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: TokenPayload }>();
    const user = request.user;
    const type = request.body?.type;
    if (!user || (type !== 'product' && type !== 'company')) {
      throw new ForbiddenException('Upload access denied');
    }

    const resource = type === 'product' ? Resource.PRODUCTS : Resource.COMPANIES;
    const requestedCompanyId = request.body?.companyId;
    const allowed = user.permissions?.some(permission =>
      (permission.resource === resource || permission.resource === Resource.ALL) &&
      (permission.actions.includes(Action.MANAGE) || permission.actions.includes(Action.CREATE) || permission.actions.includes(Action.UPDATE)) &&
      (!requestedCompanyId || !permission.companyId || String(permission.companyId) === String(requestedCompanyId)),
    );
    if (!allowed) {
      throw new ForbiddenException('Upload access denied');
    }
    return true;
  }
}
