import { Module, forwardRef } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from '../transaction/schema/transaction.schema';
import { TransactionModule } from '../transaction/transaction.module';
import { WalletsModule } from '../wallets/wallets.module';
import { OrdersModule } from '../orders/orders.module';
import { ZarinpalModule } from 'src/utils/services/zarinpal/zarinpal.module';
import { PermissionsModule } from 'src/features/permissions/permissions.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }]),
    TransactionModule,
    WalletsModule,
    OrdersModule,
    forwardRef(() => PermissionsModule),
    ZarinpalModule,
    ZarinpalModule.register({
      merchantId: process.env.ZARINPAL_MERCHANT_ID || 'a3c16110-f184-44e2-ad26-649387845a94',
      sandbox: true,
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
