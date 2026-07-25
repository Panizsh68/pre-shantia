import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthController } from '../../auth/auth.controller';
import { OrdersController } from '../../orders/orders.controller';
import { ProductsController } from '../../products/products.controller';
import { UsersController } from '../../users/users.controller';
import { WalletsController } from '../../wallets/wallets.controller';
import { PermissionsService } from '../permissions.service';
import { PermissionsGuard } from './permission.guard';

const ordinaryUser = {
  userId: 'ordinary-user-id',
  permissions: [
    { resource: 'orders', actions: ['r', 'c'] },
    { resource: 'products', actions: ['r'] },
    { resource: 'transaction', actions: ['r'] },
    { resource: 'wallets', actions: ['r', 'u'] },
    { resource: 'payment', actions: ['c'] },
  ],
} as any;

function requestContext(handler: (...args: any[]) => any): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user: ordinaryUser }) }),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard sensitive endpoint enforcement', () => {
  const guard = new PermissionsGuard(new Reflector(), new PermissionsService());

  it.each([
    ['users list', UsersController.prototype.listUsers],
    ['admin signup', AuthController.prototype.adminSignUp],
    ['permission update', AuthController.prototype.setUserPermissions],
    ['wallet transfer', WalletsController.prototype.transfer],
    ['order shipment mutation', OrdersController.prototype.markAsShipped],
    ['admin product listing', ProductsController.prototype.findAllForAdmin],
    ['product update', ProductsController.prototype.update],
  ])('returns HTTP 403 for an ordinary token on %s', (_name, handler) => {
    expect(() => guard.canActivate(requestContext(handler))).toThrow(ForbiddenException);
  });
});
