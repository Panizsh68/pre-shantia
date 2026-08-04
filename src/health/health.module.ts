import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { CachingModule } from 'src/infrastructure/caching/caching.module';
import { HealthReadinessGuard } from './health-readiness.guard';

@Module({
  imports: [
    ConfigModule,
    JwtModule,
    MongooseModule,
    CachingModule,
  ],
  controllers: [HealthController],
  providers: [HealthService, HealthReadinessGuard],
})
export class HealthModule { }
