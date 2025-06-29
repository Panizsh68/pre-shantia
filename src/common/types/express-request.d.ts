import { TokenPayload } from 'src/features/auth/interfaces/token-payload.interface';
import { User } from 'src/features/users/entities/user.entity';
import type { RequestContext } from './request-context.interface';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      context?: RequestContext;
    }
  }
}
