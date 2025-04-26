import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentRepository } from './repositories/payments.repository';

@Module({
  controllers: [PaymentsController],
  providers: [
    {
      provide: 'PaymentRepository',
      useClass: PaymentRepository
    },
    PaymentsService],
})
export class PaymentsModule {}
