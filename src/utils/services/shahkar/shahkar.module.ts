import { Module } from '@nestjs/common';
import { ShahkarService } from './shahkar.service';
import { ShahkarController } from './shahkar.controller';

@Module({
  providers: [ShahkarService],
  controllers: [ShahkarController],
  exports: [ShahkarService]
})
export class ShahkarModule {}
