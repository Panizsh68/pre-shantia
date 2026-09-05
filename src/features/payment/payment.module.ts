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

function requiredPaymentEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required payment environment variable: ${name}`);
  }
  return value || '';
}

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }]),
    TransactionModule,
    WalletsModule,
    OrdersModule,
    forwardRef(() => PermissionsModule),
    ZibalModule.register({
      merchant: requiredPaymentEnv('ZIBAL_MERCHANT_ID'),
      callbackUrl: requiredPaymentEnv('ZIBAL_CALLBACK_URL'),
      // sandbox should only be true when explicitly set to 'true'
      sandbox: (process.env.ZIBAL_SANDBOX || '').trim().toLowerCase() === 'true',
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
