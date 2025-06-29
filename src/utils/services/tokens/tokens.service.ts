import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ITokensModels } from './Itokens.interface';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { TokenPayload } from 'src/features/auth/interfaces/token-payload.interface';
import { ConfigService } from '@nestjs/config';
import { CachingService } from 'src/infrastructure/caching/caching.service';
import { RequestContext } from 'src/common/types/request-context.interface';

function isTokenPayload(obj: unknown): obj is TokenPayload {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'userId' in obj &&
    'tokenType' in obj &&
    'roles' in obj
  );
}

@Injectable()
export class TokensService<
  TAccessToken extends ITokensModels = ITokensModels,
  TRefreshToken extends ITokensModels = TAccessToken,
> implements OnModuleInit
{
  private key: Buffer;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cachingService: CachingService,
  ) {}

  async onModuleInit(): Promise<void> {
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');

    if (!encryptionKey) {
      throw new UnauthorizedException('ENCRYPTION_KEY is missing in configuration.');
    }

    this.key = Buffer.from(encryptionKey, 'hex');

    if (this.key.length !== 32) {
      throw new UnauthorizedException('Encryption key must be 32 bytes (256 bits).');
    }
  }

  private encryptString(input: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);

    let encrypted = cipher.update(input, 'utf-8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${encrypted}:${authTag}`;
  }

  private decryptString(encryptedInput: string): string {
    const parts = encryptedInput.split(':');
    if (parts.length !== 3) {
      throw new Error(
        `Invalid encrypted format: Expected IV:ciphertext:authTag, got ${parts.length}`,
      );
    }

    const [ivHex, ciphertext, authTagHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(authTag);

    try {
      let decrypted = decipher.update(ciphertext, 'hex', 'utf-8');
      decrypted += decipher.final('utf-8');
      return decrypted;
    } catch (err) {
      throw new Error('Decryption failed: possibly invalid ciphertext or auth tag.');
    }
  }

  decryptPayload(payload: Record<string, string>): Record<string, unknown> {
    const decryptedPayload: Record<string, unknown> = {};

    for (const key of Object.keys(payload)) {
      const decryptedKey = this.decryptString(key);
      let decryptedValue: unknown = this.decryptString(payload[key]?.toString() || '');
      try {
        decryptedValue = JSON.parse(decryptedValue as string);
      } catch {
        // Use string as-is
      }
      decryptedPayload[decryptedKey] = decryptedValue;
    }
    return decryptedPayload;
  }

  encryptPayload(payload: Record<string, unknown>): Record<string, string> {
    const encryptedPayload: Record<string, string> = {};

    for (const key of Object.keys(payload)) {
      const encryptedKey = this.encryptString(key);
      const encryptedValue = this.encryptString(JSON.stringify(payload[key]));
      encryptedPayload[encryptedKey] = encryptedValue;
    }

    return encryptedPayload;
  }

  async getAccessToken(data: TAccessToken): Promise<string> {
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is missing in configuration.');
    }
    return this.signToken(data, secret, 'HS256', '1h');
  }

  async getRefreshToken(data: TRefreshToken): Promise<string> {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is missing in configuration.');
    }
    return this.signToken(data, secret, 'HS256', '1h');
  }

  async validateAccessToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = await this.jwtService.verifyAsync<Record<string, string>>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        algorithms: ['HS256', 'HS512'],
      });

      delete decoded.iat;
      delete decoded.exp;

      const decrypted = this.decryptPayload(decoded);
      if (!isTokenPayload(decrypted)) {
        throw new UnauthorizedException('Invalid token structure');
      }
      return decrypted;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async validateRefreshToken(token: string, context: RequestContext): Promise<TokenPayload> {
    try {
      const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
      if (!secret) {
        throw new Error('JWT_REFRESH_SECRET is missing in configuration.');
      }
      const decoded = await this.jwtService.verifyAsync<Record<string, string>>(token, {
        secret,
        algorithms: ['HS512'],
      });

      delete decoded.iat;
      delete decoded.exp;

      const decrypted = this.decryptPayload(decoded);
      if (!isTokenPayload(decrypted)) {
        throw new UnauthorizedException('Invalid token structure');
      }

      const sessionInfo = await this.cachingService.get<{
        ip: string;
        userAgent: string;
        userId: string;
      }>(`refresh-info:${token}`);

      if (!sessionInfo) {
        throw new UnauthorizedException(
          'Session info not found. Token might be revoked or expired.',
        );
      }

      if (sessionInfo.ip !== context.ip || sessionInfo.userAgent !== context.userAgent) {
        throw new UnauthorizedException('Request context does not match original token context.');
      }

      return decrypted;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async signToken(
    data: Record<string, unknown>,
    secret: string,
    algorithm: 'HS256' | 'HS512',
    expiresIn: string,
  ): Promise<string> {
    const payload = this.encryptPayload(data);
    return this.jwtService.signAsync(payload, {
      secret,
      algorithm,
      expiresIn,
    });
  }
}
