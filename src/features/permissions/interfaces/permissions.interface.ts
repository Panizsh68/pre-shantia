import { Action } from '../enums/actions.enum';
import { Resource } from '../enums/resources.enum';

export interface IPermission {
  resource: Resource;

  actions: Action[];

  // optional scope for permission - for example limit permission to a specific company
  companyId?: string;
}
