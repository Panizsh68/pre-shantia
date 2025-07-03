import { IPermission } from 'src/features/permissions/interfaces/permissions.interface';
import { ITokensModels } from 'src/utils/services/tokens/Itokens.interface';
import { TokenType } from 'src/utils/services/tokens/tokentype.enum';

export interface TokenPayload extends ITokensModels {
  userId: string;
  userAgent?: string;
  ip?: string;
  tokenType: TokenType;
  iat?: number;
  exp?: number;
  permissions: IPermission[];
}
