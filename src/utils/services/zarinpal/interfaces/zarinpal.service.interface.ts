import { TransactionStatus } from 'src/features/transaction/enums/transaction.status.enum';
import {
  InitiateZarinpalPaymentDto,
  InitiateZarinpalPaymentResponseDto,
  VerifyZarinpalPaymentDto,
  InquireZarinpalTransactionDto,
  InquireZarinpalTransactionResponseDto,
  ProcessRefundZarinpalDto,
  ProcessRefundZarinpalResponseDto,
  GetTransactionsZarinpalDto,
  GetTransactionsZarinpalResponseDto,
} from '../dtos';

export interface IZarinpalService {
  initiatePayment(
    initiatePaymentDto: InitiateZarinpalPaymentDto,
  ): Promise<InitiateZarinpalPaymentResponseDto>;
  verifyPayment(verifyPaymentDto: VerifyZarinpalPaymentDto): Promise<{
    authority: string;
    ref_id: string;
    status: TransactionStatus;
    amount: number;
  }>;
  unverifiedPayments(): Promise<{ transactions: unknown | [] }>;
  processRefund(
    processRefundDto: ProcessRefundZarinpalDto,
  ): Promise<ProcessRefundZarinpalResponseDto>;
  inquireTransaction(
    inquireTransactionDto: InquireZarinpalTransactionDto,
  ): Promise<InquireZarinpalTransactionResponseDto>;
  getTransactions(
    getTransactionsDto: GetTransactionsZarinpalDto,
  ): Promise<GetTransactionsZarinpalResponseDto>;
}
