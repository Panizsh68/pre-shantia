import type { TokenPayload } from 'src/features/auth/interfaces/token-payload.interface';

export interface RequestContext {
  userAgent: string;
  ip: string;
  user?: TokenPayload;
}
