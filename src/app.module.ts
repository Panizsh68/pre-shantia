import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule, RedisModuleOptions } from '@nestjs-modules/ioredis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './infrastructure/config/configuration';
import configurationProd from './infrastructure/config/configuration.prod';
import { UsersModule } from './features/users/users.module';
import { OtpModule } from './utils/services/otp/otp.module';
import { ShahkarModule } from './utils/services/shahkar/shahkar.module';
import { TokensModule } from './utils/services/tokens/tokens.module';
import { ProductsModule } from './features/products/products.module';
import { TicketingModule } from './features/ticketing/ticketing.module';
import { TransportingsModule } from './features/transportings/transportings.module';
import { CompaniesModule } from './features/companies/companies.module';
import { OrdersModule } from './features/orders/orders.module';
import { WalletsModule } from './features/wallets/wallets.module';
import { TransactionModule } from './features/transaction/transaction.module';
import { PaymentModule } from './features/payment/payment.module';
import { CartsModule } from './features/carts/carts.module';
import { CategoriesModule } from './features/categories/categories.module';
import { ZarinpalModule } from './utils/services/zarinpal/zarinpal.module';
import { HealthController } from './health/health.controller';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CachingModule } from './infrastructure/caching/caching.module';
import { RequestContextInterceptor } from './utils/interceptors/request-context.interceptor';
import { SwaggerController } from './swagger.controller';
import { SwaggerService } from './swagger.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URL'),
        retryAttempts: 10,
        retryDelay: 2000,
        serverSelectionTimeoutMS: 5000,
        directConnection: true,
      }),
      inject: [ConfigService],
    }),

    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService): Promise<RedisModuleOptions> => ({
        type: 'single',
        options: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
        },
      }),
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
    TransportingsModule,
    CompaniesModule,
    OrdersModule,
    WalletsModule,
    TransactionModule,
    PaymentModule,
    CartsModule,
    CategoriesModule,
    ZarinpalModule,
  ],
  controllers: [AppController, HealthController, SwaggerController],
  providers: [AppService, SwaggerService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestContextInterceptor,
    },
  ],
})
export class AppModule { }
