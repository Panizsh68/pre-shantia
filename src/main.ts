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
  const expressApp = express()
  const adapter = new ExpressAdapter(expressApp)

  // 2) ساخت Nest با آن adapter
  const app = await NestFactory.create(AppModule, adapter)
  app.use(cors({ origin: ['https://ariasakht.com', 'https://www.ariasakht.com'] }));

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


  app.setGlobalPrefix('api')

  // 3) تولید داکیومنت Swagger
  const swaggerService = app.get(SwaggerService)
  const document = swaggerService.createDocument(app)
  // 4) **دریافت instance اصلی Express** از زیرِ دست Nest
  const server: any = app.getHttpAdapter().getInstance()

  // 5) ثبت Swagger روی همین Express، مسیر دلخواه
  SwaggerModule.setup('docs', server, document)
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
