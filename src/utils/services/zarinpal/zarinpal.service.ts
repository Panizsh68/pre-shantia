import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import ZarinPal from 'zarinpal-node-sdk';
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
} from './dtos';
import { TransactionService } from 'src/features/transaction/transaction.service';
import { CreateTransactionDto } from 'src/features/transaction/dtos/create-transaction.dto';
import { TransactionStatus } from 'src/features/transaction/enums/transaction.status.enum';
import { RefundStatus } from 'src/features/transaction/enums/refund.status.enum';
import { UpdateTransactionDto } from 'src/features/transaction/dtos/update-transaction.dto';
import { IZarinpalService } from './interfaces/zarinpal.service.interface';

@Injectable()
export class ZarinpalService implements IZarinpalService {
  private zarinpal: ZarinPal;

  constructor(
    @Inject('ITransactionsService') private readonly transactionService: TransactionService,
  ) {
    this.zarinpal = new ZarinPal({
      merchantId: 'a3c16110-f184-44e2-ad26-649387845a94',
      sandbox: true,
    });
  }

  async initiatePayment(
    initiatePaymentDto: InitiateZarinpalPaymentDto,
  ): Promise<InitiateZarinpalPaymentResponseDto> {
    try {
      const payment = await this.zarinpal.payments.create({
        amount: initiatePaymentDto.amount,
        callback_url: initiatePaymentDto.callbackUrl || 'http://localhost:3000/payment/callback',
        description: initiatePaymentDto.description,
        mobile: initiatePaymentDto.mobile,
        email: initiatePaymentDto.email,
      });

      const authority = payment.data.authority;
      const url = await this.zarinpal.payments.getRedirectUrl(authority);

      const createTransactionDto: CreateTransactionDto = {
        authority,
        amount: initiatePaymentDto.amount,
        description: initiatePaymentDto.description,
        mobile: initiatePaymentDto.mobile,
        email: initiatePaymentDto.email,
        status: TransactionStatus.PENDING,
        createdAt: new Date(),
        userId: initiatePaymentDto.userId,
      };
      await this.transactionService.create(createTransactionDto);
      const response: InitiateZarinpalPaymentResponseDto = {
        authority,
        url,
      };
      return response;
    } catch (error) {
      throw new Error(`failed to initiate payment: ${error.message}`);
    }
  }

  async verifyPayment(verifyPaymentDto: VerifyZarinpalPaymentDto): Promise<{
    authority: string;
    ref_id: string;
    status: TransactionStatus;
    amount: number;
  }> {
    try {
      const transaction = await this.transactionService.findOne(verifyPaymentDto.authority);
      if (!transaction) {
        throw new NotFoundException('transaction not found');
      }
      const response = await this.zarinpal.verifications.verify({
        amount: verifyPaymentDto.amount,
        authority: verifyPaymentDto.authority,
      });
      const transactionStatus =
        response.data?.status === '100' ? TransactionStatus.COMPLETED : TransactionStatus.FAILED;

      await this.transactionService.update(verifyPaymentDto.authority, {
        ref_id: response.data?.ref_id,
        status: transactionStatus,
        verifiedAt: new Date(),
      } as UpdateTransactionDto);
      return {
        authority: verifyPaymentDto.authority,
        ref_id: response.data?.ref_id,
        status: transactionStatus,
        amount: verifyPaymentDto.amount,
      };
    } catch (error) {
      throw new Error(`Payment verification failed: ${error.message}`);
    }
  }

  async unverifiedPayments(): Promise<{ transactions: unknown | [] }> {
    try {
      const response = await this.zarinpal.unverified.list();
      return {
        transactions: response.data || [],
      };
    } catch (error) {
      throw new Error(`unverified payments not found:  ${error.message}`);
    }
  }

  async processRefund(
    processRefundDto: ProcessRefundZarinpalDto,
  ): Promise<ProcessRefundZarinpalResponseDto> {
    try {
      const transaction = await this.transactionService.findOne(processRefundDto.sessionId);
      if (!transaction || transaction.status !== TransactionStatus.COMPLETED) {
        throw new NotFoundException('Transaction not found or not completed');
      }

      const refundResponse = await this.zarinpal.refunds.create({
        sessionId: processRefundDto.sessionId,
        amount: processRefundDto.amount,
        description: processRefundDto.description,
        method: processRefundDto.method,
        reason: processRefundDto.reason,
      });

      const refundStatus =
        processRefundDto.amount >= transaction.amount
          ? RefundStatus.COMPLETED
          : RefundStatus.PARTIALLY_COMPLETED;
      const transactionStatus =
        processRefundDto.amount >= transaction.amount
          ? TransactionStatus.REFUNDED
          : TransactionStatus.PARTIALLY_REFUNDED;

      await this.transactionService.update(processRefundDto.sessionId, {
        refund_id: refundResponse.id,
        refund_status: refundStatus,
        status: transactionStatus,
        refund_amount: processRefundDto.amount,
        refund_reason: processRefundDto.reason,
        refundedAt: new Date(),
      } as UpdateTransactionDto);

      const updatedTransaction = await this.transactionService.findOne(processRefundDto.sessionId);
      return {
        refundId: refundResponse.id,
        amount: processRefundDto.amount,
        status: refundResponse.status,
        transaction: {
          authority: updatedTransaction.authority,
          status: updatedTransaction.status,
          refund_status: updatedTransaction.refund_status,
          refund_amount: updatedTransaction.refund_amount,
        },
      };
    } catch (error) {
      await this.transactionService.update(processRefundDto.sessionId, {
        refund_status: RefundStatus.FAILED,
      } as UpdateTransactionDto);
      throw new Error(`Refund Failed: ${error.message}`);
    }
  }

  async inquireTransaction(
    inquireTransactionDto: InquireZarinpalTransactionDto,
  ): Promise<InquireZarinpalTransactionResponseDto> {
    try {
      const transaction = await this.transactionService.findOne(inquireTransactionDto.authority);
      if (!transaction) {
        throw new NotFoundException('transaction not found');
      }
      const response = await this.zarinpal.inquiries.inquire({
        authority: inquireTransactionDto.authority,
      });
      const transactionStatus =
        response.data?.status === '100' ? TransactionStatus.COMPLETED : TransactionStatus.FAILED;
      await this.transactionService.update(inquireTransactionDto.authority, {
        inquire_result: response.data,
        inquiredAt: new Date(),
        status: transactionStatus,
      } as UpdateTransactionDto);
      return {
        authority: inquireTransactionDto.authority,
        amount: response.data?.amount,
        status: response.data?.status,
        ref_id: response.data?.ref_id,
      };
    } catch (error) {
      throw new Error(`Inquire Failed: ${error.message}`);
    }
  }

  async getTransactions(
    getTransactionsDto: GetTransactionsZarinpalDto,
  ): Promise<GetTransactionsZarinpalResponseDto> {
    const transactions = await this.zarinpal.transactions.list({
      terminalId: getTransactionsDto.terminalId,
      filter: getTransactionsDto.filter,
      limit: getTransactionsDto.limit,
      offset: getTransactionsDto.offset,
    });

    const enrichedTransactions = await Promise.all(
      transactions.data.map(async apiTransaction => {
        const dbTransaction = await this.transactionService.findOne(apiTransaction.authority);
        return {
          ...apiTransaction,
          db_status: dbTransaction?.status,
          refund_status: dbTransaction?.refund_status,
          refund_amount: dbTransaction?.refund_amount,
        };
      }),
    );
    return {
      transactions: enrichedTransactions,
      total: transactions.total,
      offset: transactions.offset,
      limit: transactions.limit,
    };
  }
}
