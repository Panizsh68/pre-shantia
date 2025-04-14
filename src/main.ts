import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import rateLimit from 'express-rate-limit';
import { writeFileSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true
    }
  }))

  app.setGlobalPrefix('api')

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100
    })
  )

  const config = new DocumentBuilder()
    .setTitle('practice')
    .setDescription('API documentation for my practice app')
    .setVersion('0.0.1')
    .build()

  const document = SwaggerModule.createDocument(app, config)

  writeFileSync('./swagger.json', JSON.stringify(document, null, 2));

  SwaggerModule.setup('api', app, document)
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
