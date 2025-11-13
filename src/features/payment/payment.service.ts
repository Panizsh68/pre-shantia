import { BadRequestException, Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { TransactionStatus } from '../transaction/enums/transaction.status.enum';
import { IZibalService } from 'src/utils/services/zibal/interfaces/zibal.service.interface';
import { ITransactionService } from '../transaction/interfaces/transaction.service.interface';
import { IWalletService } from '../wallets/interfaces/wallet.service.interface';
import { IOrdersService } from '../orders/interfaces/order.service.interface';
import { WalletOwnerType } from '../wallets/enums/wallet-ownertype.enum';
import { OrdersStatus } from '../orders/enums/orders.status.enum';
import { IZIBAL_SERVICE } from 'src/utils/services/zibal/constants/zibal.constants';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { CreateTransactionDto } from '../transaction/dtos/create-transaction.dto';
import { InitiateZibalPaymentType } from 'src/utils/services/zibal/types/initiate.zibal.payment.type';
import { VerifyZibalPaymentResponseType } from 'src/utils/services/zibal/types/verify.zibal.payment.type';
import { UpdateTransactionDto } from '../transaction/dtos/update-transaction.dto';
import { ClientSession } from 'mongoose';

// Local tokens to avoid brittle string literals inside this file. These map to providers configured in modules.
export const TRANSACTIONS_SERVICE = 'ITransactionsService';
export const WALLETS_SERVICE = 'IWalletsService';
export const ORDERS_SERVICE = 'IOrdersService';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  constructor(
    @Inject(IZIBAL_SERVICE) private readonly zibalService: IZibalService,
    @Inject(TRANSACTIONS_SERVICE) private readonly transactionService: ITransactionService,
    @Inject(WALLETS_SERVICE) private readonly walletsService: IWalletService,
    @Inject(ORDERS_SERVICE) private readonly ordersService: IOrdersService,
    private readonly configService: ConfigService,
  ) { }

  async initiatePayment(userId: string, orderId: string, amount: number) {
    // Validate order first (avoid creating orphan transactions)
    const order = await this.ordersService.findById(orderId);
    if (!order) { throw new NotFoundException('Order not found'); }
    if (order.status !== OrdersStatus.PENDING) { throw new BadRequestException('Order is not pending'); }
    if (order.userId.toString() !== userId) { throw new BadRequestException('Unauthorized'); }

    // Ensure callback URL is configured (fail-fast)
    const callbackUrl = this.configService.get<string>('ZIBAL_CALLBACK_URL');
    if (!callbackUrl) {
      this.logger.error('ZIBAL_CALLBACK_URL not configured');
      throw new BadRequestException('Payment provider not configured');
    }

    // Create local transaction record after validation
    const localId = uuidv4();
    const txCreatePayload: CreateTransactionDto = {
      localId,
      trackId: null,
      amount,
      description: `Payment for order ${order.id}`,
      status: TransactionStatus.PENDING,
      currency: 'IRR',
      createdAt: new Date(),
      userId,
      orderId,
      metadata: { orderId: String(order.id) },
    };

    const transaction = await this.transactionService.create(txCreatePayload);

    try {
      const paymentRequest: InitiateZibalPaymentType = {
        amount,
        callbackUrl,
        description: txCreatePayload.description,
        userId,
        orderId,
      };

      const { trackId, paymentUrl } = await this.zibalService.createPayment(paymentRequest);

      // Persist trackId immediately to avoid callback-before-write race
      if (typeof (this.transactionService as any).updateByLocalId === 'function') {
        // updateByLocalId is optional on the interface; call if available
        await (this.transactionService as any).updateByLocalId(localId, { trackId: String(trackId) } as Partial<CreateTransactionDto>);
      } else {
        this.logger.error('updateByLocalId not implemented on TransactionService');
        throw new BadRequestException('Internal server error');
      }

      // Return both transaction DB id and localId for correlation
      return { transactionId: (transaction as any).id ?? (transaction as any)._id, localId, paymentUrl };
    } catch (error) {
      this.logger.error('initiatePayment error', JSON.stringify({ userId, orderId, amount, err: String(error) }));
      throw new BadRequestException('Failed to initiate payment');
    }
  }

  async handleCallback(trackId: string, success: string) {
    const session: ClientSession = await this.transactionService.startSession();
    try {
      // Validate trackId
      if (!trackId || typeof trackId !== 'string') {
        throw new BadRequestException('Invalid trackId');
      }
      const transaction = await this.transactionService.findOne(trackId, session);
      if (!transaction) { throw new NotFoundException('Transaction not found'); }

      // Idempotency: if transaction already completed, return it without changing state
      if (transaction.status === TransactionStatus.COMPLETED) {
        await this.transactionService.commitSession(session);
        return transaction;
      }

      if (success !== '1' && success !== 'OK') {
        // پرداخت ناموفق: سفارش failed شود
        if (!transaction.orderId) {
          this.logger.error('Transaction missing orderId for failed payment', JSON.stringify({ trackId, transactionId: transaction.id }));
          throw new BadRequestException('Payment failed');
        }
        await this.ordersService.update({ id: transaction.orderId, status: OrdersStatus.FAILED }, session);
        throw new BadRequestException('Payment failed');
      }

      let verificationResult: VerifyZibalPaymentResponseType;
      try {
        verificationResult = await this.zibalService.verifyPayment(trackId);
      } catch (err) {
        // log and mark order failed without exposing SDK internals
        this.logger.error('Zibal verify error', JSON.stringify({ trackId, transactionId: transaction.id, err: String(err) }));
        if (transaction.orderId) {
          await this.ordersService.update({ id: transaction.orderId, status: OrdersStatus.FAILED }, session);
        }
        throw new BadRequestException('Verification failed');
      }

      const statusCode = (verificationResult.result ?? verificationResult.status)?.toString();
      if (statusCode !== '100' && statusCode !== '1') {
        // پرداخت تایید نشد: سفارش failed شود
        if (transaction.orderId) {
          await this.ordersService.update({ id: transaction.orderId, status: OrdersStatus.FAILED }, session);
        }
        throw new BadRequestException('Verification failed');
      }

      const updateDto: UpdateTransactionDto = {
        ref_id: verificationResult.ref_id ?? verificationResult.refNumber,
        status: TransactionStatus.COMPLETED,
        verifiedAt: new Date(),
      };

      // Atomically set status from PENDING -> COMPLETED to avoid race conditions.
      // If another process already finalized it, updateIfStatus will return null.

      let updatedTransaction;
      if (typeof (this.transactionService as any).updateIfStatus === 'function') {
        const atomicUpdated = await (this.transactionService as any).updateIfStatus(
          trackId,
          TransactionStatus.PENDING,
          updateDto,
          session,
        );
        if (!atomicUpdated) {
          // Another process already finalized this transaction. treat as idempotent success
          await this.transactionService.commitSession(session);
          return transaction;
        }
        updatedTransaction = atomicUpdated;
      } else {
        // Fallback: update normally (non-atomic). Best-effort in tests or older implementations.
        updatedTransaction = await this.transactionService.update(trackId, updateDto, session);
      }

      // For external gateway payments we only credit the platform/intermediary wallet.
      // Do NOT debit the user's internal wallet (that would double-deduct).
      await this.walletsService.creditWallet(
        {
          ownerId: 'INTERMEDIARY_ID',
          ownerType: WalletOwnerType.INTERMEDIARY,
          amount: transaction.amount,
        },
        session,
      );

      if (!transaction.orderId) {
        this.logger.error('Transaction missing orderId when marking paid', JSON.stringify({ transactionId: transaction.id }));
        throw new BadRequestException('Transaction missing orderId');
      }
      await this.ordersService.markAsPaid(transaction.orderId, session);

      await this.transactionService.commitSession(session);
      return updatedTransaction;
    } catch (error) {
      await this.transactionService.abortSession(session);
      this.logger.error('handleCallback error', JSON.stringify({ trackId, err: String(error) }));
      throw new BadRequestException('Payment processing failed');
    } finally {
      if (session && typeof (session as any).endSession === 'function') {
        try { await (session as any).endSession(); } catch (e) { this.logger.warn('endSession failed: ' + String(e)); }
      }
    }
  }

  /**
   * Pay using internal wallet balance. This debits the user's wallet and credits the intermediary,
   * then marks the order as paid. All operations run inside a single session to ensure atomicity.
   */
  async payWithWallet(userId: string, orderId: string, amount: number) {
    // Validate order first
    const order = await this.ordersService.findById(orderId);
    if (!order) { throw new NotFoundException('Order not found'); }
    if (order.status !== OrdersStatus.PENDING) { throw new BadRequestException('Order is not pending'); }
    if (order.userId.toString() !== userId) { throw new BadRequestException('Unauthorized'); }

    const session: ClientSession = await this.transactionService.startSession();
    try {
      // Debit user's wallet
      await this.walletsService.debitWallet({ ownerId: userId, ownerType: WalletOwnerType.USER, amount }, session as any);

      // Credit intermediary wallet
      await this.walletsService.creditWallet({ ownerId: 'INTERMEDIARY_ID', ownerType: WalletOwnerType.INTERMEDIARY, amount }, session as any);

      // Mark order as paid
      await this.ordersService.markAsPaid(orderId, session as any);

      await this.transactionService.commitSession(session);

      return { success: true, method: 'WALLET', orderId };
    } catch (error) {
      await this.transactionService.abortSession(session);
      this.logger.error('payWithWallet error', JSON.stringify({ userId, orderId, amount, err: String(error) }));
      throw new BadRequestException('Wallet payment failed');
    } finally {
      if (session && typeof (session as any).endSession === 'function') {
        try { await (session as any).endSession(); } catch (e) { this.logger.warn('endSession failed: ' + String(e)); }
      }
    }
  }
}
