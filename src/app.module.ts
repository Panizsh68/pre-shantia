import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule, RedisModuleOptions } from '@nestjs-modules/ioredis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './features/users/users.module';
import { OtpModule } from './utils/services/otp/otp.module';
import { ShahkarModule } from './utils/services/shahkar/shahkar.module';
import { TokensModule } from './utils/services/tokens/tokens.module';
import { ProductsModule } from './features/products/products.module';
import { TicketingModule } from './features/ticketing/ticketing.module';
import { TransportModule } from './features/transportings/transportings.module';
import { CompaniesModule } from './features/companies/companies.module';
import { ImageUploadModule } from './features/image-upload/image-upload.module';
import { OrdersModule } from './features/orders/orders.module';
import { WalletsModule } from './features/wallets/wallets.module';
import { TransactionModule } from './features/transaction/transaction.module';
import { PaymentModule } from './features/payment/payment.module';
import { CartsModule } from './features/carts/carts.module';
import { CategoriesModule } from './features/categories/categories.module';
import { ZibalModule } from './utils/services/zibal/zibal.module';
import { HealthModule } from './health/health.module';
import { SchedulerModule } from './features/scheduler/scheduler.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CachingModule } from './infrastructure/caching/caching.module';
import { RequestContextInterceptor } from './utils/interceptors/request-context.interceptor';
import configuration from './infrastructure/config/configuration';
import productionConfiguration from './infrastructure/config/configuration.prod';
import { RatingModule } from './features/ratings/rating.module';
import { PublicSubmissionsModule } from './features/public-submissions/public-submissions.module';

const configFactory = process.env.NODE_ENV === 'production'
  ? productionConfiguration
  : configuration;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configFactory],
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
      ignoreEnvFile: false,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URL'),
        retryAttempts: 10,
        retryDelay: 2000,
        serverSelectionTimeoutMS: 5000,
      }),
      inject: [ConfigService],
    }),

    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService): Promise<RedisModuleOptions> => {
        const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
        const host = configService.get<string>('REDIS_HOST');
        const port = configService.get<number>('REDIS_PORT');
        const password = configService.get<string>('REDIS_PASSWORD');

        if (!host || !port) {
          throw new Error('Redis configuration is incomplete: host and port are required');
        }

        if (nodeEnv === 'production' && !password) {
          throw new Error('Redis production configuration is incomplete: password is required in production');
        }

        return {
          type: 'single',
          options: {
            host,
            port,
            ...(password ? { password } : {}),
          },
        };
      },
      inject: [ConfigService],
    }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        secret: config.get('JWT_SECRET_KEY'),
        global: true,
      }),
      inject: [ConfigService],
    }),
    CachingModule,
    UsersModule,
    ShahkarModule,
    OtpModule,
    TokensModule,
    ProductsModule,
    TicketingModule,
    TransportModule,
    CompaniesModule,
    OrdersModule,
    WalletsModule,
    TransactionModule,
    PaymentModule,
    CartsModule,
    SchedulerModule,
    CategoriesModule,
    ZibalModule,
    ImageUploadModule,
    RatingModule,
    HealthModule,
    PublicSubmissionsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestContextInterceptor,
    },
  ],
})
export class AppModule { }
