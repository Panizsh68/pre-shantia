import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ITokensModels } from './Itokens.interface';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { TokenPayload } from 'src/features/users/auth/interfaces/token-payload.interface';
import { ConfigService } from '@nestjs/config';

type TokenType<T> = T & {
  exp: number;
  iat: number;
};

@Injectable()
export class TokensService<
  TAccessToken extends ITokensModels = ITokensModels,
  TRefreshToken extends ITokensModels = TAccessToken
> implements OnModuleInit {
  private key: Buffer; // Encryption key
  private iv: Buffer;  // Initialization vector

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');

    if (!encryptionKey) {
      throw new UnauthorizedException('ENCRYPTION_KEY is missing in configuration.');
    }

    this.key = Buffer.from(encryptionKey, 'hex');

    if (this.key.length !== 32) {
      throw new UnauthorizedException('Encryption key must be 32 bytes (256 bits).');
    }

    this.iv = randomBytes(16); // Generate a random IV
  }

  // Encrypts a string using AES-256-GCM
  private encryptString(input: string): string {
    const iv = randomBytes(16); // Ensure a unique IV per encryption
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);

    let encrypted = cipher.update(input, 'utf-8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex'); // Authentication tag

    const encryptedOutput = `${iv.toString('hex')}:${encrypted}:${authTag}`;
    return encryptedOutput;
  }

  // Decrypts a string using AES-256-GCM
  private decryptString(encryptedInput: string): string {

    const parts = encryptedInput.split(':');
    if (parts.length !== 3) {
      throw new Error(`Invalid encrypted format: Expected IV:ciphertext:authTag, got ${parts.length}`);
    }

    const [ivHex, ciphertext, authTagHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    if (!Buffer.isBuffer(iv) || !Buffer.isBuffer(authTag)) {
      throw new Error("Invalid IV or authentication tag format.");
    }

    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');

    return decrypted;
  }

  // Decrypts a payload object
  decryptPayload(payload: Record<string, string>): Record<string, any> {

    const decryptedPayload: Record<string, any> = {};

    for (const key of Object.keys(payload)) {
      const decryptedKey = this.decryptString(key);
      let decryptedValue = this.decryptString(payload[key]?.toString() || '');
      try {
        decryptedValue = JSON.parse(decryptedValue); // Ensure parsing if JSON
      } catch {
          // If parsing fails, keep it as a string
      }
      decryptedPayload[decryptedKey] = decryptedValue;
    }
    return decryptedPayload;
}

  encryptPayload(payload: Record<string, any>): Record<string, string> {

    if (Array.isArray(payload.permissions)) {
        payload.permissions = payload.permissions.map((perm) => {
            return { resource: perm.resource, action: perm.action };
        }) 
    } 
    const encryptedPayload: Record<string, string> = {};

    for (const key of Object.keys(payload)) {
      const encryptedKey = this.encryptString(key);
      const encryptedValue = this.encryptString(JSON.stringify(payload[key])); // Convert to JSON

      encryptedPayload[encryptedKey] = encryptedValue;
    }
    return encryptedPayload;
  }

  // Generates an access token with encrypted payload
  async getAccessToken(data: TAccessToken): Promise<string> {
    const payload = this.encryptPayload(data);
    return this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      algorithm: 'HS256',
      expiresIn: '1h'
    });
  }

  // Generates a refresh token with encrypted payload
  async getRefreshToken(data: TRefreshToken): Promise<string> {
    const payload = this.encryptPayload(data);
    return this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      algorithm: 'HS512',
      expiresIn: '48h'
    });
  }

  // Validates and decrypts a JWT token
  async validate(token: string): Promise<TokenPayload> {
    try {
      const decoded = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET,
        algorithms: ['HS256', 'HS512'],
      });

      delete decoded.iat;
      delete decoded.exp;

      return this.decryptPayload(decoded) as TokenPayload;
    } catch (error) {
            throw new UnauthorizedException('Invalid token');
    }
  }
}
