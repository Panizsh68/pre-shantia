import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { TokenPayload } from '../interfaces/token-payload.interface';
import { Request } from 'express';


@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly tokensService: TokensService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
  
    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }
  
    try {
      const payload: TokenPayload = await this.tokensService.validate(token);
      request['user'] = payload; // Attach payload to the request
    } catch (error) {
      throw new UnauthorizedException('Invalid authorization token');
    }
  
    return true;
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