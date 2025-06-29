import { Request } from 'express';
import { TokenPayload } from 'src/features/auth/interfaces/token-payload.interface';

export interface AuthenticatedRequest extends Request {
  user: TokenPayload;
}
