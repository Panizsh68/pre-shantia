import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { AuthenticationGuard } from '../users/auth/guards/auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  @UseGuards(AuthenticationGuard)
  async initiatePayment(@Body() initiatePaymentDto: InitiatePaymentDto, @Req() req: any) {
    const userId =  req.user.userId
    return this.paymentsService.initiatePayment({...initiatePaymentDto, userId })
  }


  @Get('callback')
  async handleCallback(@Query() verifypaymentDto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(verifypaymentDto)
  }
}
