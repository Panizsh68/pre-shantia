import { Module, forwardRef } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from '../transaction/schema/transaction.schema';
import { TransactionModule } from '../transaction/transaction.module';
import { WalletsModule } from '../wallets/wallets.module';
import { OrdersModule } from '../orders/orders.module';
import { ZibalModule } from 'src/utils/services/zibal/zibal.module';
import { PermissionsModule } from 'src/features/permissions/permissions.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }]),
    TransactionModule,
    WalletsModule,
    OrdersModule,
    forwardRef(() => PermissionsModule),
    ZibalModule.register({
      merchant: process.env.ZIBAL_MERCHANT_ID || '68b44a2ca45c720011a852e0',
      callbackUrl: process.env.ZIBAL_CALLBACK_URL || 'http://localhost:3000/payment/callback',
      // sandbox should only be true when explicitly set to 'true'
      sandbox: (process.env.ZIBAL_SANDBOX || '').toLowerCase() === 'true',
      logLevel: parseInt(process.env.ZIBAL_LOG_LEVEL || '2', 10),
    }),
  ],
  controllers: [PaymentController],
  providers: [
    {
      provide: 'IPaymentService',
      useClass: PaymentService,
    },
  ],
})
export class PaymentModule { }
