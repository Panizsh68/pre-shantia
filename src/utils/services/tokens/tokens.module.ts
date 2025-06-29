import { Global, Module } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { JwtService } from '@nestjs/jwt';

@Global()
@Module({
  providers: [TokensService, JwtService],
  exports: [TokensService],
})
export class TokensModule {}
