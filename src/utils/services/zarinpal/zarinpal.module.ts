import { Module } from '@nestjs/common';
import { ZarinpalService } from './zarinpal.service';
import { TransactionModule } from 'src/features/transaction/transaction.module';

@Module({
  imports: [TransactionModule],
  providers: [
    {
      provide: 'IZarinpalService',
      useClass: ZarinpalService,
    },
  ],
  exports: ['IZarinpalService'],
})
export class ZarinpalModule {}
