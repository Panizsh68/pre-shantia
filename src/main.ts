import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import rateLimit from 'express-rate-limit';
import { RequestContextInterceptor } from './utils/interceptors/request-context.interceptor';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap(): Promise<void> {
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);

  const app = await NestFactory.create(AppModule, adapter);

  app.enableCors({
    origin: [
      'https://ariasakht.com',
      'https://www.ariasakht.com',
      'http://localhost:3000'
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    preflightContinue: false,
  });

  expressApp.set('trust proxy', 1);

  // Configure body size limits for file uploads (10MB)
  expressApp.use(express.json({ limit: '10mb' }));
  expressApp.use(express.urlencoded({ limit: '10mb', extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('API Docs')
    .setDescription('API description')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Save swagger.json in project root
  const fs = require('fs');
  const path = require('path');
  const swaggerPath = path.join(__dirname, '..', 'swagger.json');
  fs.writeFileSync(swaggerPath, JSON.stringify(document, null, 2), 'utf8');
  console.log(`Swagger JSON file written to: ${swaggerPath}`);

  SwaggerModule.setup('docs', app, document);

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
    }),
  );

  app.useGlobalInterceptors(new RequestContextInterceptor());

  await app.listen(3000, '0.0.0.0');
}
bootstrap();
