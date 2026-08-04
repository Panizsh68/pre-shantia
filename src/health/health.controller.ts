import { Controller, Get, UseGuards } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthReadinessGuard } from './health-readiness.guard';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) { }

  @Get('live')
  async getLiveness() {
    return this.healthService.checkLiveness();
  }

  @Get('ready')
  @UseGuards(HealthReadinessGuard)
  async getReadiness() {
    return this.healthService.checkReadiness();
  }

  @Get()
  async getHealth() {
    return this.healthService.checkLiveness();
  }
}
