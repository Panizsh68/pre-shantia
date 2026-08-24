import { HttpException, Injectable, OnModuleInit, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ITokensModels } from './Itokens.interface';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { TokenPayload } from 'src/features/auth/interfaces/token-payload.interface';
import { ConfigService } from '@nestjs/config';
import { CachingService } from 'src/infrastructure/caching/caching.service';
import { RequestContext } from 'src/common/types/request-context.interface';

export const authVersionKey = (userId: string): string => `auth-version:${userId}`;

function isTokenPayload(obj: unknown): obj is TokenPayload {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'userId' in obj &&
    'tokenType' in obj &&
    'permissions' in obj
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
      throw new Error('Invalid encrypted format.');
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
    } catch {
      throw new Error('Decryption failed.');
    }
  }

  decryptPayload(payload: Record<string, string>): Record<string, unknown> {
    const decryptedPayload: Record<string, unknown> = {};
    for (const key of Object.keys(payload)) {
      const decryptedKey = this.decryptString(key);
      let decryptedValue: unknown = this.decryptString(payload[key]);
      try {
        decryptedValue = JSON.parse(decryptedValue as string);
      } catch {
        // Fallback if value is not valid JSON
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
    const authVersion = await this.getAuthVersion(data.userId);
    return this.signToken(
      { ...data, authVersion },
      secret,
      'HS256',
      this.configService.get<string>('JWT_ACCESS_EXPIRES') || '10m',
    );
  }

  async getRefreshToken(data: TRefreshToken): Promise<string> {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is missing in configuration.');
    }
    return this.signToken(
      data,
      secret,
      'HS512',
      this.configService.get<string>('JWT_REFRESH_EXPIRES') || '48h',
    );
  }

  async validateAccessToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = await this.jwtService.verifyAsync<Record<string, string>>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
      delete (decoded as any).iat;
      delete (decoded as any).exp;
      const decrypted = this.decryptPayload(decoded);
      if (!isTokenPayload(decrypted)) {throw new UnauthorizedException('Invalid token structure');}
      const tokenVersion = Number((decrypted as TokenPayload & { authVersion?: unknown }).authVersion ?? 0);
      const currentVersion = await this.getAuthVersion(decrypted.userId);
      if (!Number.isInteger(tokenVersion) || tokenVersion !== currentVersion) {
        throw new UnauthorizedException('Access token has been revoked');
      }
      return decrypted;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new UnauthorizedException('Invalid token');
    }
  }

  async bumpAuthVersion(userId: string): Promise<number> {
    const ttlSeconds = this.getAuthVersionTtlSeconds();
    const nextVersion = await this.cachingService.increment(authVersionKey(userId), ttlSeconds);
    if (nextVersion === null) {
      throw new ServiceUnavailableException('Authentication session store is unavailable');
    }
    return nextVersion;
  }

  private async getAuthVersion(userId: string): Promise<number> {
    let currentVersion: number | null;
    try {
      currentVersion = await this.cachingService.getStrict<number>(authVersionKey(userId));
    } catch {
      throw new ServiceUnavailableException('Authentication session store is unavailable');
    }

    if (currentVersion === null) {
      return 0;
    }
    if (!Number.isInteger(currentVersion) || currentVersion < 0) {
      throw new ServiceUnavailableException('Invalid authentication session state');
    }
    return currentVersion;
  }

  private getAuthVersionTtlSeconds(): number {
    const configuredRefreshTtl = Number(this.configService.get<string>('JWT_REFRESH_TTL_SECONDS'));
    const configuredAccessTtl = Number(this.configService.get<string>('JWT_ACCESS_TTL_SECONDS'));
    const refreshTtl = Number.isFinite(configuredRefreshTtl) && configuredRefreshTtl > 0
      ? configuredRefreshTtl
      : 48 * 3600;
    const accessTtl = Number.isFinite(configuredAccessTtl) && configuredAccessTtl > 0
      ? configuredAccessTtl
      : 10 * 60;
    return refreshTtl + accessTtl + 3600;
  }

  async validateRefreshToken(token: string, context: RequestContext): Promise<TokenPayload> {
    let decrypted: TokenPayload;
    try {
      const decoded = await this.jwtService.verifyAsync<Record<string, string>>(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        algorithms: ['HS512'],
      });
      delete (decoded as any).iat;
      delete (decoded as any).exp;
      const payload = this.decryptPayload(decoded);
      if (!isTokenPayload(payload)) {throw new UnauthorizedException('Invalid token structure');}
      decrypted = payload;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new UnauthorizedException({
        message: 'Invalid refresh token',
        code: 'AUTH_SESSION_INVALID',
      });
    }

    let sessionInfo: { ip: string; userAgent: string; userId: string } | null;
    try {
      sessionInfo = await this.cachingService.getStrict<{ ip: string; userAgent: string; userId: string }>(
        `refresh-info:${token}`,
      );
    } catch {
      throw new ServiceUnavailableException('Authentication session store is unavailable');
    }

    if (!sessionInfo || sessionInfo.userAgent !== context.userAgent) {
      throw new UnauthorizedException({
        message: 'Session context mismatch.',
        code: 'AUTH_SESSION_INVALID',
      });
    }
    return decrypted;
  }

  private async signToken(
    data: Record<string, unknown>,
    secret: string,
    algorithm: 'HS256' | 'HS512',
    expiresIn: string,
  ): Promise<string> {
    const payload = this.encryptPayload(data);
    const options: JwtSignOptions = { 
      secret, 
      algorithm: algorithm as any, 
      expiresIn: expiresIn as any
    };
    return this.jwtService.signAsync(payload, options);
  }
}
