import { Inject, Injectable } from '@nestjs/common';
import Zarinpal from 'zarinpal-node-sdk';
import {
  InitiateZarinpalPaymentType,
  ProcessRefundZarinpalType,
  ProcessRefundZarinpalResponseType,
  InitiateZarinpalPaymentResponseType,
  VerifyZarinpalPaymentRequestType,
  VerifyZarinpalPaymentResponseType,
} from './types';
import { ConfigService } from '@nestjs/config';
import { ZARINPAL_SDK } from './constants/zarinpal.constants';
import { IZarinpalService } from './interfaces/zarinpal.service.interface';

@Injectable()
export class ZarinpalService implements IZarinpalService {
  constructor(
    private readonly configService: ConfigService,
    @Inject(ZARINPAL_SDK) private readonly zarinpal: Zarinpal,
  ) {}

  async createPayment(
    dto: InitiateZarinpalPaymentType,
  ): Promise<InitiateZarinpalPaymentResponseType> {
    const payment = await this.zarinpal.payments.create({
      amount: dto.amount,
      callback_url: this.configService.get<string>('ZARINPAL_CALLBACK_URL') || dto.callbackUrl,
      description: dto.description,
      email: dto.email,
      mobile: dto.mobile,
    });

    return {
      authority: payment.data.authority,
      url: this.zarinpal.payments.getRedirectUrl(payment.data.authority),
    };
  }

  verifyPayment(dto: VerifyZarinpalPaymentRequestType): Promise<VerifyZarinpalPaymentResponseType> {
    return this.zarinpal.verifications.verify({
      authority: dto.authority,
      amount: dto.amount,
    });
  }

  refund(dto: ProcessRefundZarinpalType): Promise<ProcessRefundZarinpalResponseType> {
    return this.zarinpal.refunds.create({
      sessionId: dto.sessionId,
      amount: dto.amount,
      description: dto.description,
      method: dto.method,
      reason: dto.reason,
    });
  }
}
