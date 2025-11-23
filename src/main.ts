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

  // Dark mode CSS for Swagger UI
  const darkModeCss = `
    :root {
      --swagger-ui-colors-text-primary: #e0e0e0;
      --swagger-ui-colors-text-secondary: #b0b0b0;
    }
    body {
      background: #1e1e1e;
      color: #e0e0e0;
    }
    .swagger-ui {
      filter: invert(0.93) hue-rotate(180deg);
    }
    .swagger-ui .topbar {
      background-color: #0d0d0d;
      border-bottom: 1px solid #333;
    }
    .swagger-ui .btn {
      background: #333;
      color: #e0e0e0;
      border-color: #555;
    }
    .swagger-ui .btn:hover {
      background: #444;
    }
    .swagger-ui input,
    .swagger-ui textarea,
    .swagger-ui select {
      background: #2a2a2a;
      color: #e0e0e0;
      border-color: #555;
    }
    .swagger-ui .model-box {
      background: #2a2a2a;
      border: 1px solid #444;
    }
    .swagger-ui .scheme-container {
      background: #1e1e1e;
      border: 1px solid #333;
    }
  `;

  SwaggerModule.setup('docs', app, document, {
    customCss: darkModeCss,
  });

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
