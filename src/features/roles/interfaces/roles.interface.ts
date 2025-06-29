import { IPermission } from './permissions.interface';

export interface IRole {
  name: string;
  permissions: IPermission[];
}
