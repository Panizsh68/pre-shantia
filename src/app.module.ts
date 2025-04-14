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
import { ChatModule } from './features/chat/chat.module';
import { MessagesModule } from './features/messages/messages.module';
import { PaymentsModule } from './features/payments/payments.module';
import { WalletModule } from './features/wallet/wallet.module';



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
    ChatModule,
    MessagesModule,
    PaymentsModule,
    WalletModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Instead of using /*path, use :path as a named parameter
    consumer.apply(RequestContextMiddleware).forRoutes({ path: '/*path', method: RequestMethod.ALL });
  }
}