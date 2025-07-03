import { IPermission } from 'src/features/permissions/interfaces/permissions.interface';
import { TokenType } from './tokentype.enum';

export interface ITokensModels extends Record<string, unknown> {
  tokenType: TokenType;
  userId: string;
  userAgent?: string;
  ip?: string;
  permissions?: IPermission[];
}
