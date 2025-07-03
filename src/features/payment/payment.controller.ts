import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { InitiateZarinpalPaymentType } from 'src/utils/services/zarinpal/types';

@Controller('payment')
export class PaymentController {
  constructor(@Inject('IPaymentService') private readonly paymentService: PaymentService) {}

  @Post('initiate')
  async initiatePayment(@Body() dto: InitiateZarinpalPaymentType) {
    return this.paymentService.initiatePayment(dto.userId, dto.orderId, dto.amount);
  }

  @Get('callback')
  async handleCallback(@Query('Authority') authority: string, @Query('Status') status: string) {
    return this.paymentService.handleCallback(authority, status);
  }
}
