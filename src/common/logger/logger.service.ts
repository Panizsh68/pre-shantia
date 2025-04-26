import { Injectable } from "@nestjs/common";
import * as winston from "winston";

@Injectable()
export class LoggerService {

    private logger: winston.Logger;

    constructor() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    )
                }),
                new winston.transports.File({ filename: 'logs/error.log', level: 'error'}),
                new winston.transports.File({ filename: 'logs/combined.log' })
            ]
        })
    }

    log(message: string, context?: string) {
        this.logger.info(message, { context })
    }

    error(message: string, trace?: string, context?: string) {
        this.logger.error(message, { trace, context })
    }
}