import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import rateLimit from 'express-rate-limit';
import { RequestContextInterceptor } from './utils/interceptors/request-context.interceptor';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);

  const app = await NestFactory.create(AppModule, adapter);

  // Set Global Prefix FIRST
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: true, // In dev, allow all to prevent workstation domain issues
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  expressApp.set('trust proxy', 1);
  expressApp.use(express.json({ limit: '10mb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Tejaris API')
    .setDescription('Industrial Marketplace B2B API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 2000,
    }),
  );

  app.useGlobalInterceptors(new RequestContextInterceptor());

  // Use PORT from environment (run.sh passes 3001)
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  
  logger.log(`🚀 Backend API is running on: http://localhost:${port}/api`);
  logger.log(`📜 Swagger documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
