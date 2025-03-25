import { Module } from '@nestjs/common';
import { CachingService } from './caching.service';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: 'localhost', // Change if using an external Redis server
      port: 6379, // Default Redis port
      ttl: 3000, // Cache expiration time in seconds
    }),
  ],
  providers: [CachingService],
  exports: [CachingService],
})
export class CachingModule {}
