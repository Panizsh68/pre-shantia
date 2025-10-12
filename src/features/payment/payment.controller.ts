import { Body, Controller, Get, Inject, Post, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { AuthenticationGuard } from '../auth/guards/auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { InitiatePaymentDto } from '../../utils/services/zibal/dtos/initiate.zibal.payment.dto';
import { HandleCallbackResponseDto } from './handle-callback.dto';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(@Inject('IPaymentService') private readonly paymentService: PaymentService) { }

  @Post('initiate')
  @UseGuards(AuthenticationGuard)
  @ApiOperation({ summary: 'Initiate a payment via Zibal', description: 'This route is open for default users.' })
  @ApiBody({ type: InitiatePaymentDto })
  @ApiResponse({
    status: 201,
    description: 'Payment request created and redirect URL returned',
    schema: {
      type: 'object',
      properties: {
        transactionId: { type: 'string', example: 'tx1' },
        paymentUrl: { type: 'string', example: 'https://sandbox.zibal.ir/pg/StartPay/1533727744287' },
      },
    },
  })
  async initiatePayment(@Body() dto: InitiatePaymentDto) {
    return this.paymentService.initiatePayment(dto.userId, dto.orderId, dto.amount);
  }

  @Get('callback')
  @ApiOperation({ summary: 'Handle Zibal callback after payment', description: 'This route is open for default users.' })
  @ApiQuery({ name: 'trackId', required: true, type: String, description: 'Zibal trackId' })
  @ApiQuery({ name: 'success', required: true, type: String, enum: ['1', '0'], description: 'Payment success flag (1 = success)' })
  @ApiResponse({
    status: 200,
    description: 'Payment verified or failed',
    type: HandleCallbackResponseDto,
  })
  async handleCallback(
    @Query('trackId') trackId: string,
    @Query('success') success: string,
    @Query('secret') secret?: string,
    @Req() req?: any,
  ) {
    // Quick secret check: require either query param 'secret' or header 'x-callback-secret'
    const configured = (process.env.PAYMENT_CALLBACK_SECRET || '').trim();
    const headerSecret = req?.headers?.['x-callback-secret'] || req?.headers?.['X-Callback-Secret'];
    const provided = (secret || headerSecret || '').toString().trim();
    if (configured && configured.length > 0 && provided !== configured) {
      throw new BadRequestException('Invalid callback secret');
    }

    // proceed to business logic
    return this.paymentService.handleCallback(trackId, success);
  }
}
