import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { TokenPayload } from 'src/features/auth/interfaces/token-payload.interface';
import { Action } from 'src/features/permissions/enums/actions.enum';
import { Resource } from 'src/features/permissions/enums/resources.enum';

@Injectable()
export class UploadAuthorizationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: TokenPayload }>();
    return this.assertAuthorized(request, request.body?.type, request.body?.companyId);
  }

  /**
   * Multipart fields are populated by Multer's interceptor. Since Nest runs
   * guards before interceptors, multipart routes must call this after files
   * have been parsed by the interceptor.
   */
  assertAuthorized(
    request: Request & { user?: TokenPayload },
    type: unknown,
    requestedCompanyId?: unknown,
  ): boolean {
    const user = request.user;
    if (!user || (type !== 'product' && type !== 'company')) {
      throw new ForbiddenException('Upload access denied');
    }

    const resource = type === 'product' ? Resource.PRODUCTS : Resource.COMPANIES;
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
