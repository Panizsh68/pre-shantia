import { Module } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  providers: [TokensService, JwtService]
})
export class TokensModule {}
