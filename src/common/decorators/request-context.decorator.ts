import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { RequestContext as ContextType } from 'src/common/types/request-context.interface';

export const RequestContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ContextType => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.context!;
  },
);
