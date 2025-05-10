import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './features/users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ShahkarModule } from './utils/services/shahkar/shahkar.module';
import { OtpModule } from './utils/services/otp/otp.module';
import * as redisStore from 'cache-manager-redis-store';
import { CacheModule } from '@nestjs/cache-manager';
import { TokensModule } from './utils/services/tokens/tokens.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './infrastructure/config/configuration';
import { RequestContextMiddleware } from './utils/middlewares/request-context.middleware';
import { JwtModule } from '@nestjs/jwt';
import { ProductsModule } from './features/products/products.module';
import { TicketingModule } from './features/ticketing/ticketing.module';
import { CachingModule } from './infrastructure/caching/caching.module';
import { TransportingsModule } from './features/transportings/transportings.module';
import { CompaniesModule } from './features/companies/companies.module';
import { OrdersModule } from './features/orders/orders.module';
import { GoftinoModule } from './utils/services/goftino/goftino.module';
import { GoftinoChatsService } from './utils/services/goftino/services/goftino-chats.service';
import { GoftinoUsersService } from './utils/services/goftino/services/goftino-users.service';
import { GoftinoOperatorsService } from './utils/services/goftino/services/goftino-operators.service';
import { LoggerService } from './common/logger/logger.service';
import { GoftinoService } from './utils/services/goftino/services/goftino.service';
import { TransactionsModule } from './features/transactions/transactions.module';
import { PaymentsModule } from './features/payments/payments.module';
import { WalletsModule } from './features/wallets/wallets.module';
import { CartsModule } from './features/carts/carts.module';
import { CategoriesModule } from './features/categories/categories.module';



@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      envFilePath: '.env',
      cache: true
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URL', 'mongodb://localhost:27017/test'),
      }),
      inject: [ConfigService]
      
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get<string>('REDIS_HOST', 'localhost'), // Change to your Redis server IP if needed
        port: configService.get<number>('REDIS_PORT', 6379),
        ttl: configService.get<number>('OTP_TTL', 30000), // Default expiry time (in seconds) for OTPs (2 minutes)
      }),
      inject: [ConfigService]
    }),
    JwtModule.registerAsync({ 
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRECT_KEY'),
        global: true
      }),
      inject: [ConfigService]
     }), 
    UsersModule,
    ShahkarModule,
    OtpModule,
    TokensModule,
    ProductsModule,
    TicketingModule,
    CachingModule,
    TransportingsModule,
    CompaniesModule,
    OrdersModule,
    GoftinoModule,
    WalletsModule,
    TransactionsModule,
    PaymentsModule,
    WalletsModule,
    CartsModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: 'BASE_GOFTINO_SERVICE',
      useClass: GoftinoService
    },
    AppService, GoftinoChatsService, GoftinoUsersService, GoftinoOperatorsService, LoggerService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Instead of using /*path, use :path as a named parameter
    consumer.apply(RequestContextMiddleware).forRoutes({ path: '/*path', method: RequestMethod.ALL });
  }
}