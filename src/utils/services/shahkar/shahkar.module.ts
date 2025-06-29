import { Module } from '@nestjs/common';
import { ShahkarService } from './shahkar.service';

@Module({
  providers: [ShahkarService],
  exports: [ShahkarService],
})
export class ShahkarModule {}
