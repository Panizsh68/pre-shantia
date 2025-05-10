import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { ZarinpalCreatePaymentDto } from "./dto/zpal-create-payment.dto";
import { ZarinpalVerifyPaymentDto } from "./dto/zpal-verify-payment.dto";
import { ConfigService } from "@nestjs/config";
import { response } from "express";

@Injectable()
export class ZarinpalService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}
  async createPayment(createPaymentDto: ZarinpalCreatePaymentDto) {
    const adjustedAmount = createPaymentDto.currency === 'IRR' ? createPaymentDto.amount: 
    createPaymentDto.amount * 10;
    const response = await this.httpService.axiosRef.post(`${this.configService.get('ZPNODE_URL')}/pay`, {
      amount: adjustedAmount,
      callback: `${this.configService.get('APP_URL')}/payments/callback`,
      description: `Payment #${createPaymentDto.paymentId}`,
      payment_id: createPaymentDto.paymentId,
    })
    return {
      authority: response.data.Authority,
      paymentUrl: response.data.url,
    };
  }

  async verifyPayment(verifyPaymentDto: ZarinpalVerifyPaymentDto) {
    const response =  await this.httpService.axiosRef.post(`${this.configService.get('ZPNODE_URL')}/verify`, {
      authority: verifyPaymentDto.authority,
      amount: verifyPaymentDto.amount
    })
    return {
      status: response.data.Status === 100 || response.data.Status === 101 ? 'SUCCESS' : 'FAILED',
      refId: response.data.RefID || null,
    };
  }
}