import { Controller, Get } from '@nestjs/common';
import { SwaggerService } from './swagger.service';

@Controller()
export class SwaggerController {
  constructor(private readonly swaggerService: SwaggerService) {}

  @Get('swagger.json')
  getSwaggerJson(): string {
    const doc = this.swaggerService.getDocument();
    if (!doc) throw new Error('Swagger document not generated');
    return JSON.stringify(doc, null, 2);
  }
}