import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from '../transaction/schema/transaction.schema';
import { TransactionModule } from '../transaction/transaction.module';
import { WalletsModule } from '../wallets/wallets.module';
import { OrdersModule } from '../orders/orders.module';
import { ZarinpalModule } from 'src/utils/services/zarinpal/zarinpal.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }]),
    TransactionModule,
    WalletsModule,
    OrdersModule,
    ZarinpalModule,
    PaymentModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
