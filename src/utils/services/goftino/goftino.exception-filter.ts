import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { Response } from "express";
import { LoggerService } from "src/common/logger/logger.service";



@Catch(HttpException)
export class GoftinoExceptionFilter implements ExceptionFilter {

    constructor(private readonly loggerService: LoggerService) {}

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status = exception.getStatus();
        const errorResponse = exception.getResponse() as any;

        let code: string;
        switch(status) {
            case 400:
                code = '2';
                break;
            case 401:
                code = '1';
                break;
            case 403:
                code = '3';
                break;
            case 500:
                code = '4';
                break;
            default: 
                code = '5';
        }

        this.loggerService.error(
            `Exception: ${exception.message}`, 
            exception.stack, 
            'GoftinoExceptionFilter');

        response.status(status).json({
            status: 'error',
            code,
            message: errorResponse.message || 'An error occurred',
            timestamp: new Date().toISOString()
        })
    }
}