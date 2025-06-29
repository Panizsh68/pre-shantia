import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { TokenPayload } from '../interfaces/token-payload.interface';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly tokensService: TokensService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    try {
      const payload: TokenPayload = await this.tokensService.validateAccessToken(token);
      request['user'] = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid authorization token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authorizationHeader = request.headers.authorization;
    if (!authorizationHeader) {
      return undefined;
    }

    const [type, token] = authorizationHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid token format');
    }
    return token;
  }
}
