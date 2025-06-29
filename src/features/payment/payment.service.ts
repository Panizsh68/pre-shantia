import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { OrdersStatus } from '../orders/enums/orders.status.enum';
import { WalletOwnerType } from '../wallets/enums/wallet-ownertype.enum';
import { CreateTransactionDto } from '../transaction/dtos/create-transaction.dto';
import { TransactionStatus } from '../transaction/enums/transaction.status.enum';
import { VerifyZarinpalPaymentDto } from 'src/utils/services/zarinpal/dtos/verify.zarinpal.payment.dto';
import { ClientSession } from 'mongoose';
import { UpdateTransactionDto } from '../transaction/dtos/update-transaction.dto';
import { IZarinpalService } from 'src/utils/services/zarinpal/interfaces/zarinpal.service.interface';
import { ITransactionService } from '../transaction/interfaces/transaction.service.interface';
import { IWalletService } from '../wallets/interfaces/wallet.service.interface';
import { IOrdersService } from '../orders/interfaces/order.service.interface';
import { Transaction } from '../transaction/schema/transaction.schema';

@Injectable()
export class PaymentService {
  constructor(
    @Inject('IZarinpalService') private readonly zarinpalService: IZarinpalService,
    @Inject('ITransactionsService') private readonly transactionService: ITransactionService,
    @Inject('IWalletsService') private readonly walletsService: IWalletService,
    @Inject('IOrdersService') private readonly ordersService: IOrdersService,
  ) {}

  async processOrderPayment(
    orderId: string,
    userId: string,
    session?: ClientSession,
  ): Promise<{ orderId: string; transactionId: string; status: string }> {
    const paymentSession = session || (await this.transactionService.startSession());
    try {
      const order = await this.ordersService.findById(orderId, session);
      if (!order) {
        throw new NotFoundException('Order not found');
      }
      if (order.status !== OrdersStatus.PENDING) {
        throw new BadRequestException('Order is not pending');
      }
      if (order.userId.toString() !== userId) {
        throw new BadRequestException('Unauthorized');
      }

      const userWallet = await this.walletsService.getWallet(
        { ownerId: userId, ownerType: WalletOwnerType.USER },
        session,
      );
      if (userWallet.balance < order.totalPrice) {
        throw new BadRequestException('Insufficient balance');
      }

      const createTransactionDto: CreateTransactionDto = {
        authority: `ORDER_${orderId}_${Date.now()}`,
        amount: order.totalPrice,
        description: `Payment for order ${orderId}`,
        status: TransactionStatus.PENDING,
        createdAt: new Date(),
        userId,
      };
      const transaction = await this.transactionService.create(createTransactionDto, session);

      await this.walletsService.debitWallet(
        { ownerId: userId, ownerType: WalletOwnerType.USER, amount: order.totalPrice },
        session,
      );
      await this.walletsService.creditWallet(
        {
          ownerId: 'INTERMEDIARY_ID',
          ownerType: WalletOwnerType.INTERMEDIARY,
          amount: order.totalPrice,
        },
        session,
      );

      await this.ordersService.markAsPaid(orderId, session);

      await this.transactionService.update(
        transaction.authority,
        { status: TransactionStatus.COMPLETED, verifiedAt: new Date() } as UpdateTransactionDto,
        session,
      );

      if (!session) {
        await this.transactionService.commitSession(paymentSession);
      }
      return { orderId, transactionId: transaction.authority, status: TransactionStatus.COMPLETED };
    } catch (error) {
      if (!session) {
        await this.transactionService.abortSession(paymentSession);
      }
      throw new BadRequestException(`Payment failed: ${error.message}`);
    }
  }

  async handleCallback(authority: string, status: string): Promise<Transaction> {
    const session = await this.transactionService.startSession();
    try {
      if (status !== 'OK') {
        throw new BadRequestException('Payment failed');
      }

      const transaction = await this.transactionService.findOne(authority, session);
      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }
      const verifyDto: VerifyZarinpalPaymentDto = { authority, amount: transaction.amount };
      const result = await this.zarinpalService.verifyPayment(verifyDto);

      await this.walletsService.creditWallet(
        {
          ownerId: transaction.userId,
          ownerType: WalletOwnerType.USER,
          amount: transaction.amount,
        },
        session,
      );

      const updatedTransaction = await this.transactionService.update(
        authority,
        {
          ref_id: result.ref_id,
          status: result.status, // فرض بر سازگاری
          verifiedAt: new Date(),
        } as UpdateTransactionDto,
        session,
      );

      await this.transactionService.commitSession(session);
      return updatedTransaction;
    } catch (error) {
      await this.transactionService.abortSession(session);
      throw new BadRequestException(`Callback handling failed: ${error.message}`);
    }
  }
}
