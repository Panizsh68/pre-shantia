import { isSuperAdmin, hasPermission, checkResourceAccess, canAccessOwnResource, ensureOwnResourceAccess, applyUserOwnershipFilter, canAccessCompanyResource, canPerformAction } from './auth-helpers';
import { Resource } from 'src/features/permissions/enums/resources.enum';
import { Action } from 'src/features/permissions/enums/actions.enum';
import { TokenPayload } from 'src/features/auth/interfaces/token-payload.interface';
import { TokenType } from 'src/utils/services/tokens/tokentype.enum';
import { ForbiddenException } from '@nestjs/common';

describe('Authorization Helpers', () => {
  
  const mockSuperAdmin: TokenPayload = {
    userId: 'admin123',
    tokenType: TokenType.access,
    permissions: [
      {
        resource: Resource.ALL,
        actions: [Action.MANAGE],
      },
    ],
  };

  const mockRegularUser: TokenPayload = {
    userId: 'user123',
    tokenType: TokenType.access,
    permissions: [
      {
        resource: Resource.PRODUCTS,
        actions: [Action.READ],
      },
    ],
  };

  const mockStaffUser: TokenPayload = {
    userId: 'staff123',
    tokenType: TokenType.access,
    permissions: [
      {
        resource: Resource.ORDERS,
        actions: [Action.CREATE, Action.READ, Action.UPDATE],
      },
      {
        resource: Resource.PRODUCTS,
        actions: [Action.READ, Action.UPDATE],
      },
    ],
  };

  describe('isSuperAdmin', () => {
    it('should return true for superadmin user', () => {
      const result = isSuperAdmin(mockSuperAdmin);
      expect(result).toBe(true);
    });

    it('should return false for regular user', () => {
      const result = isSuperAdmin(mockRegularUser);
      expect(result).toBe(false);
    });

    it('should return false for staff user without Resource.ALL', () => {
      const result = isSuperAdmin(mockStaffUser);
      expect(result).toBe(false);
    });

    it('should return false when user has no permissions', () => {
      const userNoPerms: TokenPayload = { userId: 'user456', tokenType: TokenType.access, permissions: [] };
      const result = isSuperAdmin(userNoPerms);
      expect(result).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('should return true for superadmin on any resource/action', () => {
      const result = hasPermission(mockSuperAdmin, Resource.PRODUCTS, Action.DELETE);
      expect(result).toBe(true);
    });

    it('should return true when user has the specific permission', () => {
      const result = hasPermission(mockRegularUser, Resource.PRODUCTS, Action.READ);
      expect(result).toBe(true);
    });

    it('should return false when user lacks the permission', () => {
      const result = hasPermission(mockRegularUser, Resource.PRODUCTS, Action.CREATE);
      expect(result).toBe(false);
    });

    it('should return false for wrong resource', () => {
      const result = hasPermission(mockRegularUser, Resource.ORDERS, Action.READ);
      expect(result).toBe(false);
    });

    it('should return true for staff user with matching permission', () => {
      const result = hasPermission(mockStaffUser, Resource.ORDERS, Action.UPDATE);
      expect(result).toBe(true);
    });
  });

  describe('checkResourceAccess', () => {
    it('should return true when user has resource access', () => {
      const result = checkResourceAccess(mockStaffUser, Resource.PRODUCTS, Action.UPDATE);
      expect(result).toBe(true);
    });

    it('should return false when user lacks resource access', () => {
      const result = checkResourceAccess(mockRegularUser, Resource.ORDERS, Action.READ);
      expect(result).toBe(false);
    });

    it('should return true for superadmin', () => {
      const result = checkResourceAccess(mockSuperAdmin, Resource.PRODUCTS, Action.DELETE);
      expect(result).toBe(true);
    });
  });

  describe('canAccessOwnResource', () => {
    it('should return true when user owns the resource', () => {
      const result = canAccessOwnResource(mockRegularUser, 'user123');
      expect(result).toBe(true);
    });

    it('should return true for superadmin even if they don\'t own it', () => {
      const result = canAccessOwnResource(mockSuperAdmin, 'user123');
      expect(result).toBe(true);
    });

    it('should return false when user doesn\'t own the resource', () => {
      const result = canAccessOwnResource(mockRegularUser, 'otheruser');
      expect(result).toBe(false);
    });

    it('should throw ForbiddenException when throwError=true and access denied', () => {
      expect(() => {
        canAccessOwnResource(mockRegularUser, 'otheruser', true);
      }).toThrow(ForbiddenException);
    });

    it('should not throw when throwError=false and access denied', () => {
      expect(() => {
        canAccessOwnResource(mockRegularUser, 'otheruser', false);
      }).not.toThrow();
    });
  });

  describe('ensureOwnResourceAccess', () => {
    it('should not throw when user owns the resource', () => {
      expect(() => {
        ensureOwnResourceAccess(mockRegularUser, 'user123', 'item');
      }).not.toThrow();
    });

    it('should throw ForbiddenException when user doesn\'t own the resource', () => {
      expect(() => {
        ensureOwnResourceAccess(mockRegularUser, 'otheruser', 'item');
      }).toThrow(ForbiddenException);
    });

    it('should include resource name in error message', () => {
      expect(() => {
        ensureOwnResourceAccess(mockRegularUser, 'otheruser', 'ticket');
      }).toThrow(/ticket/i);
    });

    it('should allow superadmin regardless of ownership', () => {
      expect(() => {
        ensureOwnResourceAccess(mockSuperAdmin, 'otheruser', 'item');
      }).not.toThrow();
    });
  });

  describe('applyUserOwnershipFilter', () => {
    it('should not modify conditions for superadmin', () => {
      const conditions = { status: 'active' };
      const result = applyUserOwnershipFilter(mockSuperAdmin, true, conditions);
      expect(result).toEqual({ status: 'active' });
      expect(result.userId).toBeUndefined();
    });

    it('should add userId filter for regular user', () => {
      const conditions = { status: 'active' };
      const result = applyUserOwnershipFilter(mockRegularUser, false, conditions);
      expect(result).toEqual({ status: 'active', userId: 'user123' });
    });

    it('should preserve existing conditions', () => {
      const conditions = { status: 'active', priority: 'high' };
      const result = applyUserOwnershipFilter(mockRegularUser, false, conditions);
      expect(result).toEqual({ status: 'active', priority: 'high', userId: 'user123' });
    });

    it('should handle empty conditions', () => {
      const conditions = {};
      const result = applyUserOwnershipFilter(mockRegularUser, false, conditions);
      expect(result).toEqual({ userId: 'user123' });
    });

    it('should check isSuperAdminCheck parameter correctly', () => {
      const conditions = {};
      const resultAdmin = applyUserOwnershipFilter(mockSuperAdmin, true, conditions);
      const resultRegular = applyUserOwnershipFilter(mockRegularUser, false, conditions);
      
      expect(resultAdmin).toEqual({});
      expect(resultRegular).toEqual({ userId: 'user123' });
    });
  });

  describe('canAccessCompanyResource', () => {
    it('should return true for superadmin', () => {
      const result = canAccessCompanyResource(mockSuperAdmin, 'company123');
      expect(result).toBe(true);
    });

    it('should return true when user has COMPANIES resource permission', () => {
      const userWithCompanyAccess: TokenPayload = {
        userId: 'user789',
        tokenType: TokenType.access,
        permissions: [
          {
            resource: Resource.COMPANIES,
            actions: [Action.READ, Action.UPDATE],
          },
        ],
      };
      const result = canAccessCompanyResource(userWithCompanyAccess, 'company123');
      expect(result).toBe(true);
    });

    it('should return false when user lacks COMPANIES permission', () => {
      const result = canAccessCompanyResource(mockRegularUser, 'company123');
      expect(result).toBe(false);
    });
  });

  describe('canPerformAction', () => {
    it('should return true when user has required permission', () => {
      const result = canPerformAction(mockStaffUser, Resource.ORDERS, Action.CREATE);
      expect(result).toBe(true);
    });

    it('should return true for superadmin', () => {
      const result = canPerformAction(mockSuperAdmin, Resource.PRODUCTS, Action.DELETE);
      expect(result).toBe(true);
    });

    it('should check ownership when ownershipCheck is provided', () => {
      const result = canPerformAction(mockRegularUser, Resource.PRODUCTS, Action.READ, { ownerId: 'user123' });
      expect(result).toBe(true);
    });

    it('should return false for ownership check when user doesn\'t own resource', () => {
      const result = canPerformAction(mockRegularUser, Resource.PRODUCTS, Action.READ, { ownerId: 'otheruser' });
      expect(result).toBe(false);
    });

    it('should return false when user lacks permission and ownership is not relevant', () => {
      const result = canPerformAction(mockRegularUser, Resource.ORDERS, Action.READ);
      expect(result).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should implement proper three-level access control', () => {
      // Level 1: Superadmin always has access
      expect(hasPermission(mockSuperAdmin, Resource.PRODUCTS, Action.DELETE)).toBe(true);
      
      // Level 2: Admin with specific permission
      expect(hasPermission(mockStaffUser, Resource.ORDERS, Action.CREATE)).toBe(true);
      
      // Level 3: User with ownership
      expect(canAccessOwnResource(mockRegularUser, 'user123')).toBe(true);
      expect(canAccessOwnResource(mockRegularUser, 'otheruser')).toBe(false);
    });

    it('should filter lists correctly for different user types', () => {
      const baseConditions = { status: 'active' };
      
      // Superadmin sees all
      const adminConditions = applyUserOwnershipFilter(mockSuperAdmin, true, baseConditions);
      expect(adminConditions).toEqual({ status: 'active' });
      
      // Regular user sees only theirs
      const userConditions = applyUserOwnershipFilter(mockRegularUser, false, baseConditions);
      expect(userConditions).toEqual({ status: 'active', userId: 'user123' });
    });

    it('should work correctly with combined permission and ownership checks', () => {
      const hasPermThenOwnership = 
        hasPermission(mockStaffUser, Resource.ORDERS, Action.UPDATE) &&
        canAccessOwnResource(mockStaffUser, 'staff123');
      
      expect(hasPermThenOwnership).toBe(true);

      const lackingPermission = 
        hasPermission(mockRegularUser, Resource.ORDERS, Action.UPDATE) &&
        canAccessOwnResource(mockRegularUser, 'user123');
      
      expect(lackingPermission).toBe(false);
    });
  });
});
