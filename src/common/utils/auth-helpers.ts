import { TokenPayload } from 'src/features/auth/interfaces/token-payload.interface';
import { Resource } from 'src/features/permissions/enums/resources.enum';
import { Action } from 'src/features/permissions/enums/actions.enum';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

/**
 * Check if user is a superadmin
 * Superadmin has Resource.ALL with Action.MANAGE
 */
export function isSuperAdmin(user?: TokenPayload): boolean {
  if (!user || !user.permissions || user.permissions.length === 0) {
    return false;
  }

  return user.permissions.some(
    p => p.resource === Resource.ALL && p.actions.includes(Action.MANAGE)
  );
}

/**
 * Check if user has a specific permission
 * Superadmin always returns true
 */
export function hasPermission(
  user: TokenPayload | undefined,
  resource: Resource,
  action: Action,
): boolean {
  // Superadmin has all permissions
  if (isSuperAdmin(user)) {
    return true;
  }

  if (!user || !user.permissions || user.permissions.length === 0) {
    return false;
  }

  return user.permissions.some(
    p => p.resource === resource && p.actions.includes(action)
  );
}

/**
 * Get all permissions for a user
 */
export function getUserPermissions(user?: TokenPayload): Array<{ resource: Resource; actions: Action[] }> {
  return user?.permissions || [];
}

/**
 * Create a consistent permission check that handles both users and admins
 */
export function checkResourceAccess(
  user: TokenPayload | undefined,
  resource: Resource,
  action: Action,
): boolean {
  if (!user) return false;
  return hasPermission(user, resource, action);
}

/**
 * Check if user can access their own resource
 * Superadmin یا کاربری که owner است
 */
export function canAccessOwnResource(
  user: TokenPayload | undefined,
  resourceOwnerId: string,
  throwError = true
): boolean {
  if (!user) {
    if (throwError) throw new BadRequestException('User not authenticated');
    return false;
  }

  const hasAccess = isSuperAdmin(user) || user.userId === resourceOwnerId;

  if (!hasAccess && throwError) {
    throw new ForbiddenException('Cannot access another user\'s resource');
  }

  return hasAccess;
}

/**
 * Filter options برای list endpoints
 * اگر user superadmin نیستند → فقط خودشون
 */
export function applyUserOwnershipFilter(
  user: TokenPayload | undefined,
  isSuperAdminCheck: boolean,
  currentConditions?: any
): any {
  if (!user) return currentConditions;

  // اگر superadmin یا admin → بدون filter
  if (isSuperAdminCheck) {
    return currentConditions;
  }

  // Regular user → فقط خودش
  return {
    ...currentConditions,
    userId: user.userId,
  };
}

/**
 * بررسی company-scoped access
 */
export function canAccessCompanyResource(
  user: TokenPayload | undefined,
  companyId: string
): boolean {
  if (!user) return false;

  // Superadmin always has access
  if (isSuperAdmin(user)) return true;

  // Check if user has company-scoped permission
  return user.permissions?.some(
    p => p.companyId && p.companyId.toString() === companyId
  ) || false;
}

/**
 * Ensure user has access to own resource, throw if not
 */
export function ensureOwnResourceAccess(
  user: TokenPayload | undefined,
  resourceOwnerId: string,
  resourceName = 'resource'
): void {
  if (!user) {
    throw new BadRequestException('User not authenticated');
  }

  const hasAccess = isSuperAdmin(user) || user.userId === resourceOwnerId;

  if (!hasAccess) {
    throw new ForbiddenException(`Cannot access another user's ${resourceName}`);
  }
}

/**
 * Check if user can perform an action based on permission
 * Includes ownership check if needed
 */
export function canPerformAction(
  user: TokenPayload | undefined,
  resource: Resource,
  action: Action,
  ownershipCheck?: {
    ownerId: string;
    resourceName?: string;
  }
): boolean {
  // Check authentication
  if (!user) return false;

  // Superadmin can do anything
  if (isSuperAdmin(user)) return true;

  // Check permission
  const hasResourcePermission = hasPermission(user, resource, action);
  if (!hasResourcePermission) return false;

  // Check ownership if needed
  if (ownershipCheck && action !== Action.CREATE) {
    const isOwner = user.userId === ownershipCheck.ownerId;
    return isOwner;
  }

  return true;
}
