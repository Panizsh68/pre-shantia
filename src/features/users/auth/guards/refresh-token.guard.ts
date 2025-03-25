import { CanActivate, ExecutionContext, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { RefreshToken } from '../schemas/refresh-token.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { TokenType } from 'src/utils/services/tokens/tokentype.enum';
import { TokenPayload } from '../interfaces/token-payload.interface';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    private readonly tokensService: TokensService,
    @InjectModel(RefreshToken.name) private refreshTokenSchema: Model<RefreshToken>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const refreshToken = request.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh Token missing');
    }

    try {
      const payload: TokenPayload = await this.tokensService.validate(refreshToken);

      if (payload.tokenType !== TokenType.refresh) { 
        throw new UnauthorizedException('Invalid Token Type');
      }

      const refreshTokenDoc = await this.refreshTokenSchema.findOne({
        token: refreshToken,
      });

      if (!refreshTokenDoc) {
        throw new NotFoundException('Token not found');
      }

      if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new UnauthorizedException('Token expired');
      }

      request['user'] = payload; // Attach payload
      return true;
    } catch (error) {
        if(error instanceof UnauthorizedException || error instanceof NotFoundException){
            throw error;
        }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}