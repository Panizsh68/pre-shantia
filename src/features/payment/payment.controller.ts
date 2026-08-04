import { Body, Controller, Get, Inject, Post, Query, UseGuards, Req, BadRequestException, Res, InternalServerErrorException } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { Response } from 'express';
import { AuthenticationGuard } from '../auth/guards/auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { HandleCallbackResponseDto } from './handle-callback.dto';
import { PayDto } from './dto/pay.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { TokenPayload } from '../auth/interfaces/token-payload.interface';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { ConfigService } from '@nestjs/config';
import { PermissionsGuard } from '../permissions/guard/permission.guard';
import { Permission } from '../permissions/decorators/permissions.decorators';
import { Resource } from '../permissions/enums/resources.enum';
import { Action } from '../permissions/enums/actions.enum';
import { AbuseRateLimit } from 'src/common/abuse/abuse-rate-limit.decorator';
import { AbuseRateLimitGuard } from 'src/common/abuse/abuse-rate-limit.guard';

@ApiTags('Payment')
@ApiBearerAuth()
@Controller('payment')
export class PaymentController {
  constructor(
    @Inject('IPaymentService') private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
  ) { }

  @Post('initiate')
  @UseGuards(AuthenticationGuard, PermissionsGuard, AbuseRateLimitGuard)
  @AbuseRateLimit({ name: 'payment-initiate', identity: 'user', config: 'PAYMENT' })
  @Permission(Resource.PAYMENT, Action.CREATE)
  @ApiOperation({ summary: 'Initiate a payment via Zibal', description: 'This route is open for default users.' })
  @ApiBody({ type: InitiatePaymentDto })
  @ApiResponse({
    status: 201,
    description: 'Payment request created and redirect URL returned',
    schema: {
      type: 'object',
      properties: {
        transactionId: { type: 'string', example: 'tx1' },
        localId: { type: 'string', example: '6b16f2f3-89de-4c8d-ae3a-49a5e38f9b90' },
        paymentUrl: { type: 'string', example: 'https://sandbox.zibal.ir/pg/StartPay/1533727744287' },
      },
    },
  })
  async initiatePayment(@Body() dto: InitiatePaymentDto, @CurrentUser() user: TokenPayload) {
    return this.paymentService.initiatePayment(user.userId, dto.orderId, dto.amount);
  }

  @Post('pay')
  @UseGuards(AuthenticationGuard, PermissionsGuard, AbuseRateLimitGuard)
  @AbuseRateLimit({ name: 'payment-pay', identity: 'user', config: 'PAYMENT' })
  @Permission(Resource.PAYMENT, Action.CREATE)
  @ApiOperation({ summary: 'Pay for an order using wallet or gateway', description: 'Choose method GATEWAY (external) or WALLET (internal).' })
  @ApiBody({ type: PayDto })
  @ApiResponse({ status: 200, description: 'Payment initiated or completed' })
  async pay(@Body() dto: PayDto, @CurrentUser() user: TokenPayload) {
    const method = dto.method ?? 'GATEWAY';
    if (method === 'GATEWAY') {
      return this.paymentService.initiatePayment(user.userId, dto.orderId, dto.amount);
    }
    // WALLET
    return this.paymentService.payWithWallet(user.userId, dto.orderId, dto.amount);
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
    @Res() res?: Response,
  ) {
    if (!trackId) {
      throw new BadRequestException('trackId is required');
    }

    const configuredSecret = (this.configService.get<string>('PAYMENT_CALLBACK_SECRET') || '').trim();
    const headerSecret = req?.headers?.['x-callback-secret'] || req?.headers?.['X-Callback-Secret'];
    const providedSecret = (secret || headerSecret || '').toString().trim();

    if (!configuredSecret) {
      throw new BadRequestException('Payment callback security secret is not configured');
    }

    const providedBuffer = Buffer.from(providedSecret);
    const configuredBuffer = Buffer.from(configuredSecret);
    const isValidSecret = providedBuffer.length === configuredBuffer.length
      && timingSafeEqual(providedBuffer, configuredBuffer);

    if (!isValidSecret) {
      throw new BadRequestException('Invalid or missing callback security secret');
    }

    // proceed to business logic
    await this.paymentService.handleCallback(trackId, success);
    const appUrl = this.configService.get<string>('APP_URL')?.trim();
    if (!appUrl) {
      throw new InternalServerErrorException('APP_URL is not configured');
    }
    return res?.redirect(303, `${appUrl}/payment/status?trackId=${encodeURIComponent(trackId)}&success=${encodeURIComponent(success)}`);
  }
}
