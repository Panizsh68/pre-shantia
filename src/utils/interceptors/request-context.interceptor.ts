import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();

    const userAgent = request.headers['user-agent'] || 'Unknown User-Agent';
    const ip: string =
      (request.headers['x-forwarded-for'] as string | undefined) ||
      request.socket?.remoteAddress ||
      'Unknown IP';

    request.context = { userAgent, ip };

    return next.handle();
  }
}
