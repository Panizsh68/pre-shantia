import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TokenPayload } from 'src/features/auth/interfaces/token-payload.interface';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): TokenPayload => {
    const request = context.switchToHttp().getRequest();
    return request.user;
  },
);
