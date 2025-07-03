import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule, RedisModuleOptions } from '@nestjs-modules/ioredis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './infrastructure/config/configuration';
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
import { APP_GUARD } from '@nestjs/core';
import { AuthenticationGuard } from './features/auth/guards/auth.guard';
import { CachingModule } from './infrastructure/caching/caching.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URL'),
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
        },
      }),
      inject: [ConfigService],
    }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        secret: config.get('JWT_SECRECT_KEY'),
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
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
  ],
})
export class AppModule {}
