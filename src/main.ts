import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import rateLimit from 'express-rate-limit';
import { RequestContextInterceptor } from './utils/interceptors/request-context.interceptor';
import cors from 'cors';
import { SwaggerService } from './swagger.service';
import { SwaggerModule } from '@nestjs/swagger';
import express from 'express'; // نگه دار
import { ExpressAdapter } from '@nestjs/platform-express';

async function bootstrap(): Promise<void> {
  const expressApp = express(); 
  const adapter = new ExpressAdapter(expressApp); 
  const app = await NestFactory.create(AppModule, adapter); 
  app.use(cors({ origin: 'http://localhost:3001' }));
  expressApp.set('trust proxy', true); 
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

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
    }),
  );

  app.useGlobalInterceptors(new RequestContextInterceptor());

  const swaggerService = app.get(SwaggerService);
  const document = swaggerService.createDocument(app);
  SwaggerModule.setup('docs', app, document); 
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();