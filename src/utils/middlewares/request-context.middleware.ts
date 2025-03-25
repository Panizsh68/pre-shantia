import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request } from "express";

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    let ip = req.headers['x-forwarded-for']
      ? (req.headers['x-forwarded-for'] as string).split(',')[0].trim()
      : req.socket?.remoteAddress || req.ip;

    req['context'] = {
      ip: ip,
      userAgent: req.headers['user-agent'] || 'Unknown User-Agent',
    };

    next();
  }
}

