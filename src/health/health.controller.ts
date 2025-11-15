import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) { }

  @Get('live')
  async getLiveness() {
    return this.healthService.checkLiveness();
  }

  @Get('ready')
  async getReadiness() {
    return this.healthService.checkReadiness();
  }

  @Get()
  async getHealth() {
    return this.healthService.checkLiveness();
  }
}
