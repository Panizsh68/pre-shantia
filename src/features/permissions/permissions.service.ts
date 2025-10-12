import { Injectable, ForbiddenException } from '@nestjs/common';
import { IPermission } from './interfaces/permissions.interface';
import { Resource } from './enums/resources.enum';
import { Action } from './enums/actions.enum';
import { toObjectIdString, isValidObjectId } from 'src/utils/objectid.util';

@Injectable()
export class PermissionsService {
  /**
   * Check whether the provided permissions include the required permission for a given resource/action.
   * If companyId is provided, it will accept permissions that either have no companyId (global) or match the given companyId.
   */
  hasPermission(
    userPermissions: IPermission[] | undefined,
    resource: Resource,
    action: Action,
    companyId?: string,
  ): boolean {
    if (!userPermissions || userPermissions.length === 0) {return false;}

    const companyObjectId = companyId && isValidObjectId(companyId) ? toObjectIdString(companyId) : undefined;

    return userPermissions.some((perm) => {
      // ALL + MANAGE always passes
      if (perm.resource === Resource.ALL && perm.actions.includes(Action.MANAGE)) {return true;}

      if (perm.resource !== resource) {return false;}

      if (!perm.actions.includes(action)) {return false;}

      // if permission has companyId, it must match the requested companyId
      if (perm.companyId) {
        if (!companyObjectId) {return false;}
        return perm.companyId.toString() === companyObjectId;
      }

      // no companyId on permission means it's global for that resource
      return true;
    });
  }

  ensurePermission(
    userPermissions: IPermission[] | undefined,
    resource: Resource,
    action: Action,
    companyId?: string,
  ) {
    if (!this.hasPermission(userPermissions, resource, action, companyId)) {
      throw new ForbiddenException('Access denied: missing required permission');
    }
    return true;
  }
}
