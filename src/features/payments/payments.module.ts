import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentRepository } from './repositories/payments.repository';
import { Model } from 'mongoose';
import { Payment, PaymentSchema } from './entities/payment.entity';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { ZarinpalService } from 'src/utils/services/zarinpal/zarinpal.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { WalletsModule } from '../wallets/wallets.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { AuthModule } from '../users/auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { WalletsService } from '../wallets/wallets.service';
import { TransactionsService } from '../transactions/transactions.service';
import { WalletRepository } from '../wallets/repositories/wallet.repository';
import { Wallet } from '../wallets/entities/wallet.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    ConfigModule,
    HttpModule,
    WalletsModule, // Provides 'WalletRepository' and WalletsService
    TransactionsModule, // Should provide TransactionsService
    AuthModule, // Should provide JwtService
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: 'PaymentRepository',
      useFactory: (paymentModel: Model<Payment>) => {
        return new PaymentRepository(paymentModel);
      },
      inject: [getModelToken(Payment.name)],
    },
    JwtService,
    TransactionsService,
    ZarinpalService,
    TokensService,
  ],
})
export class PaymentsModule {}