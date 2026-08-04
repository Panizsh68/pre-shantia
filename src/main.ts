import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import rateLimit from 'express-rate-limit';
import { RequestContextInterceptor } from './utils/interceptors/request-context.interceptor';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { RedactingLogger } from './infrastructure/logging/redacting-logger';
import { installRedactedConsole } from './infrastructure/logging/redaction';
import { ProductionExceptionFilter } from './common/filters/production-exception.filter';
import path from 'node:path';

function swaggerBasicAuth(username: string, password: string) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const header = request.headers.authorization || '';
    const encoded = header.startsWith('Basic ') ? header.slice(6) : '';
    let suppliedUser = '';
    let suppliedPassword = '';
    try {
      const decoded = Buffer.from(encoded, 'base64').toString('utf8');
      const separator = decoded.indexOf(':');
      suppliedUser = separator >= 0 ? decoded.slice(0, separator) : '';
      suppliedPassword = separator >= 0 ? decoded.slice(separator + 1) : '';
    } catch { /* treat malformed credentials as unauthorized */ }
    const matches = (left: string, right: string) => left.length === right.length &&
      left.length > 0 && timingSafeEqual(Buffer.from(left), Buffer.from(right));
    if (matches(suppliedUser, username) && matches(suppliedPassword, password)) return next();
    response.setHeader('WWW-Authenticate', 'Basic realm="API documentation"');
    response.status(401).json({ statusCode: 401, message: 'Unauthorized' });
  };
}

async function bootstrap(): Promise<void> {
  installRedactedConsole();
  const logger = new RedactingLogger('Bootstrap');
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);

  const app = await NestFactory.create(AppModule, adapter);
  app.useLogger(logger);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');

  const defaultAllowedOrigins = [
    'https://tejaris.ir',
    'https://www.tejaris.ir',
  ];

  const allowedOrigins = new Set(defaultAllowedOrigins);

  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.add('http://localhost:3000');
    allowedOrigins.add('http://127.0.0.1:3000');
  }

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS origin not allowed: ${origin}`), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  const trustedProxyHops = Number(configService.get<number>('TRUSTED_PROXY_HOPS') ?? (process.env.NODE_ENV === 'production' ? 1 : 0));
  expressApp.set('trust proxy', Number.isInteger(trustedProxyHops) && trustedProxyHops >= 0 ? trustedProxyHops : 0);
  expressApp.use(express.json({ limit: '10mb' }));
  expressApp.use(express.urlencoded({ extended: true, limit: '50mb' }));
  if (process.env.NODE_ENV !== 'production') {
    expressApp.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads'), { index: false, maxAge: '1h' }));
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new ProductionExceptionFilter());

  const swaggerSetting = configService.get<string | boolean>('ENABLE_SWAGGER');
  const swaggerEnabled = swaggerSetting === undefined || swaggerSetting === null
    ? process.env.NODE_ENV !== 'production'
    : swaggerSetting === true || swaggerSetting === 'true';
  if (swaggerEnabled) {
    const production = process.env.NODE_ENV === 'production';
    const swaggerUsername = configService.get<string>('SWAGGER_USERNAME') || '';
    const swaggerPassword = configService.get<string>('SWAGGER_PASSWORD') || '';
    if (production && (!swaggerUsername || !swaggerPassword)) {
      throw new Error('Swagger credentials are required when documentation is enabled');
    }
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Tejaris API')
      .setDescription('Industrial Marketplace B2B API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    if (production) app.use(['/api/docs', '/api/docs-json'], swaggerBasicAuth(swaggerUsername, swaggerPassword));
    SwaggerModule.setup('api/docs', app, document);
  }

  app.use(
    rateLimit({
      windowMs: (configService.get<number>('RATE_LIMITS.GLOBAL_WINDOW_SECONDS') || 900) * 1000,
      max: configService.get<number>('RATE_LIMITS.GLOBAL_MAX') || 600,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      handler: (_request, response) => response.status(429).json({ statusCode: 429, message: 'Too many requests' }),
    }),
  );

  // Keep the container port aligned with Docker healthchecks; allow a local override.
  const port = Number(process.env.BACKEND_PORT || configService.get<number>('port') || 3000);
  await app.listen(port, '0.0.0.0');
  
  logger.log(`🚀 Backend API is running on: http://localhost:${port}/api`);
}
bootstrap();
