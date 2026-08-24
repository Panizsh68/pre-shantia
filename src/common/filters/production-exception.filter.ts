import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class ProductionExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const production = process.env.NODE_ENV === 'production';
    const message = production && status >= 500 ? 'Internal server error' :
      exception instanceof HttpException ? exception.message : 'Request failed';
    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : undefined;
    const code = typeof exceptionResponse === 'object' && exceptionResponse !== null && 'code' in exceptionResponse
      ? (exceptionResponse as { code?: unknown }).code
      : undefined;
    response.status(status).json({
      statusCode: status,
      message,
      ...(typeof code === 'string' ? { code } : {}),
      requestId: request.id,
    });
  }
}
