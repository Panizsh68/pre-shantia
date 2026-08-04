import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';

@Injectable()
export class HealthReadinessGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const supplied = request.headers['x-health-readiness-token'];
    const configured = this.configService.get<string>('HEALTH_READINESS_TOKEN') || '';
    const suppliedValue = Array.isArray(supplied) ? supplied[0] : supplied || '';
    const valid = suppliedValue.length > 0 && configured.length > 0 &&
      suppliedValue.length === configured.length &&
      timingSafeEqual(Buffer.from(suppliedValue), Buffer.from(configured));
    if (!valid) throw new UnauthorizedException('Unauthorized');
    return true;
  }
}
