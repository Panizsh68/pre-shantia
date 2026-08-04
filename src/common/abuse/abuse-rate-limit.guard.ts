import { CanActivate, ExecutionContext, Injectable, HttpException, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { ABUSE_RATE_RULES, AbuseRateRule } from './abuse-rate-limit.decorator';
import { AbuseRateLimitService } from './abuse-rate-limit.service';
import { createHash } from 'node:crypto';

@Injectable()
export class AbuseRateLimitGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, @Optional() private readonly limiter?: AbuseRateLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rules = this.reflector.getAllAndOverride<AbuseRateRule[]>(ABUSE_RATE_RULES, [context.getHandler(), context.getClass()]) || [];
    if (!rules.length || !this.limiter) return true;
    const request = context.switchToHttp().getRequest<Request & { user?: { userId?: string } }>();
    const response = context.switchToHttp().getResponse<Response>();
    for (const rule of rules) {
      const identity = this.identity(request, rule.identity);
      const result = await this.limiter.consume(rule.name, identity, rule.config);
      response.setHeader('X-RateLimit-Limit', String(result.limit));
      response.setHeader('X-RateLimit-Remaining', String(result.remaining));
      if (!result.allowed) {
        response.setHeader('Retry-After', String(result.retryAfterSeconds));
        throw new HttpException('Too many requests', 429);
      }
    }
    return true;
  }

  private identity(request: Request & { user?: { userId?: string } }, type: AbuseRateRule['identity']): string {
    const ip = request.ip || 'unknown';
    const phone = String((request.body as { phoneNumber?: string } | undefined)?.phoneNumber || 'anonymous').trim().toLowerCase();
    if (type === 'phone') return `phone:${phone}`;
    if (type === 'phone-ip') return `phone:${phone}:ip:${ip}`;
    if (type === 'user') return `user:${request.user?.userId || ip}`;
    if (type === 'session') {
      const cookie = request.headers.cookie || '';
      const match = cookie.match(/(?:^|;\s*)refreshToken=([^;]+)/);
      return `session:${match ? createHash('sha256').update(match[1]).digest('hex') : ip}`;
    }
    return `ip:${ip}`;
  }
}
