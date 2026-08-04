import { Module } from '@nestjs/common';
import { ShahkarService } from './shahkar.service';
import { ConfigService } from '@nestjs/config';
import { MockShahkarService } from './mock-shahkar.service';

@Module({
    providers: [{
      provide: ShahkarService,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const mockEnabled = config.get<boolean>('MOCK_PROVIDERS_ENABLED') === true && process.env.NODE_ENV !== 'production';
        return mockEnabled ? new MockShahkarService() : new ShahkarService(config);
      },
    }],
  exports: [ShahkarService],
})
export class ShahkarModule {}
