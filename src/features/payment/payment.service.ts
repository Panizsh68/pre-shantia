import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RedactingLogger } from 'src/infrastructure/logging/redacting-logger';
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
import { getIntermediaryWalletId } from 'src/utils/intermediary-wallet.util';
import { TransactionType } from '../transaction/enums/transaction.type.enum';
import { GetWalletDto } from '../wallets/dto/get-wallet.dto';

// Local tokens to avoid brittle string literals inside this file. These map to providers configured in modules.
export const TRANSACTIONS_SERVICE = 'ITransactionsService';
export const WALLETS_SERVICE = 'IWalletsService';
export const ORDERS_SERVICE = 'IOrdersService';

const ZIBAL_MIN_AMOUNT = 1_001;
const ZIBAL_MAX_AMOUNT = 499_999_999;

function isDuplicateKeyError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && Number((error as { code?: unknown }).code) === 11000);
}

@Injectable()
export class PaymentService {
  private readonly logger = new RedactingLogger(PaymentService.name);
  constructor(
    @Inject(IZIBAL_SERVICE) private readonly zibalService: IZibalService,
    @Inject(TRANSACTIONS_SERVICE) private readonly transactionService: ITransactionService,
    @Inject(WALLETS_SERVICE) private readonly walletsService: IWalletService,
    @Inject(ORDERS_SERVICE) private readonly ordersService: IOrdersService,
    private readonly configService: ConfigService,
  ) { }

  private normalizeZibalAmount(amount: unknown, label: string): number {
    const numericAmount = Number(amount);
    const normalizedAmount = Math.round(numericAmount);
    if (!Number.isFinite(numericAmount) || !Number.isInteger(numericAmount) || !Number.isInteger(normalizedAmount)
      || normalizedAmount < ZIBAL_MIN_AMOUNT || normalizedAmount > ZIBAL_MAX_AMOUNT) {
      throw new BadRequestException(
        `${label} must be an integer between ${ZIBAL_MIN_AMOUNT} and ${ZIBAL_MAX_AMOUNT} IRR`,
      );
    }
    return normalizedAmount;
  }

  private async markPendingTransactionFailed(trackId: string, session: ClientSession): Promise<void> {
    if (typeof this.transactionService.updateIfStatus === 'function') {
      await this.transactionService.updateIfStatus(
        trackId,
        TransactionStatus.PENDING,
        { status: TransactionStatus.FAILED, verifiedAt: new Date() },
        session,
      );
      return;
    }
    await this.transactionService.update(trackId, { status: TransactionStatus.FAILED, verifiedAt: new Date() }, session);
  }

  async initiatePayment(userId: string, orderId: string, amount: number) {
    // Validate order first (avoid creating orphan transactions)
    const order = await this.ordersService.findById(orderId);
    if (!order) { throw new NotFoundException('Order not found'); }
    if (order.status !== OrdersStatus.PENDING) { throw new BadRequestException('Order is not pending'); }
    if (order.userId.toString() !== userId) { throw new BadRequestException('Unauthorized'); }
    const payableAmount = this.normalizeZibalAmount(order.totalPrice, 'Order amount');
    const requestedAmount = Number(amount);
    if (!Number.isInteger(requestedAmount) || requestedAmount !== payableAmount) {
      throw new BadRequestException('Amount mismatch');
    }

    // Reuse an unfinished gateway attempt instead of creating a second
    // payment session for the same order. The database partial unique index
    // below also protects this invariant across concurrent app instances.
    const pendingTransaction = typeof this.transactionService.findPendingByOrderId === 'function'
      ? await this.transactionService.findPendingByOrderId(orderId)
      : null;
    if (pendingTransaction) {
      if (pendingTransaction.trackId) {
        const trackId = String(pendingTransaction.trackId);
        return {
          transactionId: (pendingTransaction as any).id ?? (pendingTransaction as any)._id,
          localId: pendingTransaction.localId,
          trackId,
          paymentUrl: `https://gateway.zibal.ir/start/${encodeURIComponent(trackId)}`,
        };
      }
      throw new ConflictException('A payment is already being prepared for this order');
    }

    // Ensure callback URL is configured (fail-fast)
    const callbackUrl = this.configService.get<string>('ZIBAL_CALLBACK_URL')?.trim();
    if (!callbackUrl) {
      this.logger.error('ZIBAL_CALLBACK_URL not configured');
      throw new BadRequestException('Payment provider not configured');
    }

    // Create local transaction record after validation
    const localId = uuidv4();
    const txCreatePayload: CreateTransactionDto = {
      localId,
      trackId: null,
      amount: payableAmount,
      description: `Payment for order ${order.id}`,
      status: TransactionStatus.PENDING,
      currency: 'IRR',
      createdAt: new Date(),
      userId,
      orderId,
      metadata: { orderId: String(order.id) },
    };

    let transaction: Awaited<ReturnType<ITransactionService['create']>>;
    try {
      transaction = await this.transactionService.create(txCreatePayload);
    } catch (error) {
      if (isDuplicateKeyError(error) && typeof this.transactionService.findPendingByOrderId === 'function') {
        const existing = await this.transactionService.findPendingByOrderId(orderId);
        if (existing) {
          throw new ConflictException('A payment is already being prepared for this order');
        }
      }
      throw error;
    }

    try {
      const paymentRequest: InitiateZibalPaymentType = {
        amount: payableAmount,
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
      return {
        transactionId: (transaction as any).id ?? (transaction as any)._id,
        localId,
        trackId: String(trackId),
        paymentUrl,
      };
    } catch (error) {
      this.logger.error('initiatePayment error', JSON.stringify({ userId, orderId, amount, err: String(error) }));
      try {
        await this.transactionService.updateByLocalId?.(localId, { status: TransactionStatus.FAILED });
      } catch (updateError) {
        this.logger.error('Failed to mark order payment as failed', String(updateError));
      }
      throw new BadRequestException('Failed to initiate payment');
    }
  }

  async initiateWalletTopUp(userId: string, ownerType: WalletOwnerType, amount: number) {
    const payableAmount = this.normalizeZibalAmount(amount, 'Wallet top-up amount');

    const callbackUrl = this.configService.get<string>('ZIBAL_CALLBACK_URL')?.trim();
    if (!callbackUrl) {
      this.logger.error('ZIBAL_CALLBACK_URL not configured');
      throw new BadRequestException('Payment provider not configured');
    }

    // Resolve the wallet from the authenticated owner on the server. The
    // client never supplies ownerId or ownerType for the balance mutation.
    const wallet = await this.walletsService.getWallet({
      ownerId: userId,
      ownerType,
    } as GetWalletDto);
    if (String(wallet.currency).toUpperCase() !== 'IRR') {
      throw new BadRequestException('Zibal wallet top-ups are only supported for IRR wallets');
    }
    const localId = uuidv4();
    const transaction = await this.transactionService.create({
      localId,
      trackId: null,
      amount: payableAmount,
      description: `Wallet top-up ${localId}`,
      status: TransactionStatus.PENDING,
      type: TransactionType.CREDIT,
      currency: wallet.currency,
      createdAt: new Date(),
      userId,
      metadata: {
        kind: 'wallet_top_up',
        walletOwnerId: wallet.ownerId,
        walletOwnerType: wallet.ownerType,
      },
    });

    try {
      const paymentRequest: InitiateZibalPaymentType = {
        amount: payableAmount,
        callbackUrl,
        description: `شارژ کیف پول ${localId}`,
        orderId: localId,
        userId,
      };
      const { trackId, paymentUrl } = await this.zibalService.createPayment(paymentRequest);
      await this.transactionService.updateByLocalId!(localId, { trackId: String(trackId) });
      return {
        transactionId: (transaction as any).id ?? (transaction as any)._id,
        localId,
        trackId: String(trackId),
        paymentUrl,
      };
    } catch (error) {
      this.logger.error('initiateWalletTopUp error', JSON.stringify({ userId, amount: payableAmount, err: String(error) }));
      try {
        await this.transactionService.updateByLocalId!(localId, { status: TransactionStatus.FAILED });
      } catch (updateError) {
        this.logger.error('Failed to mark wallet top-up as failed', String(updateError));
      }
      throw new BadRequestException('Failed to initiate wallet top-up');
    }
  }

  async handleCallback(trackId: string, success: string) {
    const normalizedTrackId = String(trackId ?? '').trim();
    if (!/^\d+$/.test(normalizedTrackId)) {
      throw new BadRequestException('Invalid trackId');
    }

    const session: ClientSession = await this.transactionService.startSession();
    let committed = false;
    try {
      const transaction = await this.transactionService.findOne(normalizedTrackId, session);
      if (!transaction) { throw new NotFoundException('Transaction not found'); }

      // Idempotency: if transaction already completed, return it without changing state
      if (transaction.status === TransactionStatus.COMPLETED) {
        await this.transactionService.commitSession(session);
        return transaction;
      }
      if (transaction.status !== TransactionStatus.PENDING) {
        // A failed/refunded transaction is terminal. Do not let a replayed or
        // forged success flag make it eligible for another verification.
        await this.transactionService.commitSession(session);
        return transaction;
      }

      if (success !== '1' && success !== 'OK') {
        // Keep the order pending after a cancelled/failed gateway attempt so
        // the customer can retry with a new payment session.
        await this.markPendingTransactionFailed(normalizedTrackId, session);
        await this.transactionService.commitSession(session);
        committed = true;
        throw new BadRequestException('Payment failed');
      }

      let verificationResult: VerifyZibalPaymentResponseType;
      try {
        verificationResult = await this.zibalService.verifyPayment(normalizedTrackId);
      } catch (err) {
        // A transport/provider error is not proof of a failed payment. Keep
        // the transaction pending so a retry can reconcile a payment that
        // may already have reached Zibal.
        this.logger.error('Zibal verify unavailable', JSON.stringify({ trackId: normalizedTrackId, transactionId: transaction.id, err: String(err) }));
        throw new BadRequestException('Payment verification is temporarily unavailable');
      }

      const statusCode = (verificationResult.result ?? verificationResult.status)?.toString();
      const providerAlreadyVerified = statusCode === '201';
      if (statusCode !== '100' && statusCode !== '1' && !providerAlreadyVerified) {
        await this.markPendingTransactionFailed(normalizedTrackId, session);
        await this.transactionService.commitSession(session);
        committed = true;
        throw new BadRequestException('Verification failed');
      }

      const verifiedAmount = Number(verificationResult.amount);
      // Zibal returns 201 when this trackId was already verified. In that
      // case the SDK may omit amount/refNumber, but the provider has still
      // confirmed that the same trackId was verified before. If an amount is
      // supplied, it must still match our authoritative local amount.
      if ((!providerAlreadyVerified && !Number.isFinite(verifiedAmount))
        || (Number.isFinite(verifiedAmount)
          && Math.round(verifiedAmount) !== Math.round(Number(transaction.amount)))) {
        throw new BadRequestException('Payment amount mismatch');
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
          normalizedTrackId,
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
        updatedTransaction = await this.transactionService.update(normalizedTrackId, updateDto, session);
      }

      const metadata = transaction.metadata ?? {};
      if (metadata.kind === 'wallet_top_up') {
        const walletOwnerId = metadata.walletOwnerId;
        const walletOwnerType = metadata.walletOwnerType;
        if (typeof walletOwnerId !== 'string' || typeof walletOwnerType !== 'string'
          || !Object.values(WalletOwnerType).includes(walletOwnerType as WalletOwnerType)) {
          throw new BadRequestException('Wallet top-up owner metadata is invalid');
        }

        // The correlation id makes the wallet credit idempotent even if the
        // provider retries the callback after the transaction update.
        await this.walletsService.creditWallet(
          {
            ownerId: walletOwnerId,
            ownerType: walletOwnerType as WalletOwnerType,
            amount: transaction.amount,
            correlationId: `zibal-wallet-top-up:${normalizedTrackId}`,
          },
          session,
        );
        await this.transactionService.commitSession(session);
        committed = true;
        return updatedTransaction;
      }

      // For external gateway payments we only credit the platform/intermediary wallet.
      // Do NOT debit the user's internal wallet (that would double-deduct).
      const intermediaryId = getIntermediaryWalletId();
      await this.walletsService.creditWallet(
        {
          ownerId: intermediaryId,
          ownerType: WalletOwnerType.INTERMEDIARY,
          amount: transaction.amount,
        },
        session,
      );
      await this.walletsService.blockAmount(
        { ownerId: intermediaryId, ownerType: WalletOwnerType.INTERMEDIARY },
        transaction.amount,
        { orderId: transaction.orderId ?? undefined, reason: 'order_hold' },
        session,
      );

      if (!transaction.orderId) {
        this.logger.error('Transaction missing orderId when marking paid', JSON.stringify({ transactionId: transaction.id }));
        throw new BadRequestException('Transaction missing orderId');
      }
      await this.ordersService.markAsPaid(transaction.orderId, session);

      await this.transactionService.commitSession(session);
      committed = true;
      return updatedTransaction;
    } catch (error) {
      if (!committed) {
        await this.transactionService.abortSession(session);
      }
      this.logger.error('handleCallback error', JSON.stringify({ trackId: normalizedTrackId, err: String(error) }));
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
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
    const payableAmount = Math.round(Number(order.totalPrice || 0));
    if (Math.round(Number(amount || 0)) !== payableAmount) {
      throw new BadRequestException('Amount mismatch');
    }

    const session: ClientSession = await this.transactionService.startSession();
    try {
      // Debit user's wallet
      await this.walletsService.debitWallet({ ownerId: userId, ownerType: WalletOwnerType.USER, amount: payableAmount }, session as any);

      // Credit intermediary wallet
      const intermediaryId = getIntermediaryWalletId();
      await this.walletsService.creditWallet(
        { ownerId: intermediaryId, ownerType: WalletOwnerType.INTERMEDIARY, amount: payableAmount },
        session as any,
      );
      await this.walletsService.blockAmount(
        { ownerId: intermediaryId, ownerType: WalletOwnerType.INTERMEDIARY },
        payableAmount,
        { orderId, reason: 'order_hold' },
        session as any,
      );

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
