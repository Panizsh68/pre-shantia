import { ITokensModels } from 'src/utils/services/tokens/Itokens.interface';

export interface TokenPayload extends ITokensModels {
  userId: string;
  userAgent?: string;
  ip?: string;
  tokenType: number;
  iat?: number;
  exp?: number;
  roles: string[];
}
