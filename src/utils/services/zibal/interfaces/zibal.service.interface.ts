import {
  InitiateZibalPaymentResponseType,
  InitiateZibalPaymentType,
} from '../types/initiate.zibal.payment.type';
import {
  VerifyZibalPaymentRequestType,
  VerifyZibalPaymentResponseType,
} from '../types/verify.zibal.payment.type';
import {
  ProcessRefundZibalType,
  ProcessRefundZibalResponseType,
} from '../types/process-refund.zibal.type';

export interface IZibalService {
  createPayment(dto: InitiateZibalPaymentType): Promise<InitiateZibalPaymentResponseType>;
  verifyPayment(trackId: VerifyZibalPaymentRequestType | string | number): Promise<VerifyZibalPaymentResponseType>;
  refund(dto: ProcessRefundZibalType): Promise<ProcessRefundZibalResponseType>;
}
