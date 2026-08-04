import { ExecutionContext } from '@nestjs/common';
import { Action } from 'src/features/permissions/enums/actions.enum';
import { Resource } from 'src/features/permissions/enums/resources.enum';
import { UploadAuthorizationGuard } from './upload-authorization.guard';

describe('UploadAuthorizationGuard', () => {
  const guard = new UploadAuthorizationGuard();
  const context = (body: Record<string, unknown>, user?: any) => ({
    switchToHttp: () => ({ getRequest: () => ({ body, user }) }),
  }) as unknown as ExecutionContext;

  it('rejects anonymous uploads', () => expect(() => guard.canActivate(context({ type: 'product' }))).toThrow('Upload access denied'));
  it('rejects missing permission', () => expect(() => guard.canActivate(context({ type: 'product' }, { permissions: [] }))).toThrow('Upload access denied'));
  it('rejects a cross-company upload', () => expect(() => guard.canActivate(context({ type: 'company', companyId: 'company-b' }, {
    permissions: [{ resource: Resource.COMPANIES, actions: [Action.UPDATE], companyId: 'company-a' }],
  }))).toThrow('Upload access denied'));
  it('allows an authorized company actor', () => expect(guard.canActivate(context({ type: 'company', companyId: 'company-a' }, {
    permissions: [{ resource: Resource.COMPANIES, actions: [Action.UPDATE], companyId: 'company-a' }],
  }))).toBe(true));
});
