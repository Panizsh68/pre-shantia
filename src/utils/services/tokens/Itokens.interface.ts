import { Permission } from 'src/features/roles/dto/create-role.dto';
import { TokenType } from './tokentype.enum';

export interface ITokensModels extends Record<string, unknown> {
  tokenType: TokenType;
  userId: string;
  userAgent?: string;
  ip?: string;
  permissions?: Permission[];
}
