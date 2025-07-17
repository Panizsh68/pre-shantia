import { Injectable } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

@Injectable()
export class SwaggerService {
  private document: any;

  createDocument(app: any) {
    const config = new DocumentBuilder()
      .setTitle('practice')
      .setDescription('API documentation for my practice app')
      .setVersion('0.0.1')
      .build();
    this.document = SwaggerModule.createDocument(app, config);
    return this.document;
  }

  getDocument(): any {
    return this.document;
  }
}