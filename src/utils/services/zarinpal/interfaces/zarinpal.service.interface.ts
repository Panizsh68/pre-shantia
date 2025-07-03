import { InitiateZarinpalPaymentResponseType, InitiateZarinpalPaymentType, ProcessRefundZarinpalResponseType, ProcessRefundZarinpalType, VerifyZarinpalPaymentRequestType, VerifyZarinpalPaymentResponseType } from '../types';

export interface IZarinpalService {
  createPayment(
    dto: InitiateZarinpalPaymentType,
  ): Promise<InitiateZarinpalPaymentResponseType>;
  verifyPayment(
    dto: VerifyZarinpalPaymentRequestType,
  ): Promise<VerifyZarinpalPaymentResponseType>;
  refund(dto: ProcessRefundZarinpalType): Promise<ProcessRefundZarinpalResponseType>;
}
