import { Body, Controller, Get, Inject, Post, Query, UseGuards } from '@nestjs/common';
import { Permission } from '../permissions/decoratorss/permissions.decorators';
import { PermissionsGuard } from '../permissions/guard/permission.guard';
import { Resource } from '../permissions/enums/resources.enum';
import { Action } from '../permissions/enums/actions.enum';
import { AuthenticationGuard } from '../auth/guards/auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { InitiatePaymentDto } from '../../utils/services/zarinpal/dtos';
import { HandleCallbackResponseDto } from './handle-callback.dto';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(@Inject('IPaymentService') private readonly paymentService: PaymentService) { }

  @Post('initiate')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.PAYMENT, Action.DEFAULT)
  @ApiOperation({ summary: 'Initiate a payment via Zarinpal' })
  @ApiBody({ type: InitiatePaymentDto })
  @ApiResponse({
    status: 201,
    description: 'Payment request created and redirect URL returned',
    schema: {
      type: 'object',
      properties: {
        authority: { type: 'string', example: 'A00000000000000000000000000123456789' },
        redirectUrl: {
          type: 'string',
          example: 'https://www.zarinpal.com/pg/StartPay/A00000000000000000000000000123456789',
        },
      },
    },
  })
  async initiatePayment(@Body() dto: InitiatePaymentDto) {
    return this.paymentService.initiatePayment(dto.userId, dto.orderId, dto.amount);
  }

  @Get('callback')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.PAYMENT, Action.DEFAULT)
  @ApiOperation({ summary: 'Handle Zarinpal callback after payment' })
  @ApiQuery({
    name: 'Authority',
    required: true,
    type: String,
    description: 'Zarinpal authority token',
  })
  @ApiQuery({
    name: 'Status',
    required: true,
    type: String,
    enum: ['OK', 'NOK'],
    description: 'Payment status from Zarinpal',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment verified or failed',
    type: HandleCallbackResponseDto,
  })
  async handleCallback(@Query('Authority') authority: string, @Query('Status') status: string) {
    return this.paymentService.handleCallback(authority, status);
  }
}
