import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';

import { PaymentService } from './payment.service';
import {
  InitiateZarinpalPaymentDto,
  InitiateZarinpalPaymentResponseDto,
  VerifyZarinpalPaymentDto,
  ProcessRefundZarinpalDto,
  ProcessRefundZarinpalResponseDto,
} from 'src/utils/services/zarinpal/dtos';
import { IZarinpalService } from 'src/utils/services/zarinpal/interfaces/zarinpal.service.interface';
import { TransactionStatus } from '../transaction/enums/transaction.status.enum';
import { Transaction } from '../transaction/schema/transaction.schema';

@Controller('payment')
export class PaymentController {
  constructor(
    @Inject('IZarinpalService') private readonly zarinpalService: IZarinpalService,
    private readonly paymentService: PaymentService,
  ) {}
  @Post('initiate')
  async initiatePayment(
    @Body() initiatePaymentDto: InitiateZarinpalPaymentDto,
  ): Promise<InitiateZarinpalPaymentResponseDto> {
    const response = await this.zarinpalService.initiatePayment(initiatePaymentDto);
    return response;
  }

  @Post('verify')
  async verifyPayment(@Body() verifyPaymentDto: VerifyZarinpalPaymentDto): Promise<{
    authority: string;
    ref_id: string;
    status: TransactionStatus;
    amount: number;
  }> {
    const response = await this.zarinpalService.verifyPayment(verifyPaymentDto);
    return response;
  }

  @Post('process-refund')
  async processRefund(
    @Body() processRefundDto: ProcessRefundZarinpalDto,
  ): Promise<ProcessRefundZarinpalResponseDto> {
    const response = await this.zarinpalService.processRefund(processRefundDto);
    return response;
  }

  @Get('unverified')
  async getUnverified(): Promise<{
    transactions: unknown | [];
  }> {
    const response = await this.zarinpalService.unverifiedPayments();
    return response;
  }

  @Get('callback')
  async handleCallback(
    @Query('Authority') authority: string,
    @Query('Status') status: string,
  ): Promise<Transaction> {
    const handleCallback = await this.paymentService.handleCallback(authority, status);
    return handleCallback;
  }
}
