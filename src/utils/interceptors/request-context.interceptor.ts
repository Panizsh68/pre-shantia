import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { defer } from 'rxjs';
import { randomUUID } from 'node:crypto';
import { runWithRequestId } from 'src/infrastructure/logging/redaction';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();

    const userAgent = request.headers['user-agent'] || 'Unknown User-Agent';
    const incomingRequestId = typeof request.headers['x-request-id'] === 'string' ? request.headers['x-request-id'] : '';
    const requestId = /^[A-Za-z0-9._-]{1,128}$/.test(incomingRequestId) ? incomingRequestId : randomUUID();
    request.id = requestId;
    context.switchToHttp().getResponse().setHeader('X-Request-ID', requestId);
    const ip: string = request.ip || request.socket?.remoteAddress || 'Unknown IP';

    request.context = {
      userAgent,
      ip,
      user: request.user,
      requestId,
    };
    return defer(() => runWithRequestId(requestId, () => next.handle()));
  }
}
