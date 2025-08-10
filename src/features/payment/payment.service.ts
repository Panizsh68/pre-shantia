import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TransactionStatus } from '../transaction/enums/transaction.status.enum';
import { IZarinpalService } from 'src/utils/services/zarinpal/interfaces/zarinpal.service.interface';
import { ITransactionService } from '../transaction/interfaces/transaction.service.interface';
import { IWalletService } from '../wallets/interfaces/wallet.service.interface';
import { IOrdersService } from '../orders/interfaces/order.service.interface';
import { WalletOwnerType } from '../wallets/enums/wallet-ownertype.enum';
import { OrdersStatus } from '../orders/enums/orders.status.enum';
import { IZARINPAL_SERVICE } from 'src/utils/services/zarinpal/constants/zarinpal.constants';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentService {
  constructor(
    @Inject(IZARINPAL_SERVICE) private readonly zarinpalService: IZarinpalService,
    @Inject('ITransactionsService') private readonly transactionService: ITransactionService,
    @Inject('IWalletsService') private readonly walletsService: IWalletService,
    @Inject('IOrdersService') private readonly ordersService: IOrdersService,
    private readonly configService: ConfigService,
  ) { }

  async initiatePayment(userId: string, orderId: string, amount: number) {
    const session = await this.transactionService.startSession();
    try {
      const order = await this.ordersService.findById(orderId, session);
      if (!order) throw new NotFoundException('Order not found');
      if (order.status !== OrdersStatus.PENDING)
        throw new BadRequestException('Order is not pending');
      if (order.userId.toString() !== userId) throw new BadRequestException('Unauthorized');

      const createDto = {
        authority: '',
        amount,
        description: `Payment for order ${order.id}`,
        status: TransactionStatus.PENDING,
        createdAt: new Date(),
        userId,
        orderId,
      };

      const transaction = await this.transactionService.create(createDto, session);

      const { authority, url } = await this.zarinpalService.createPayment({
        amount,
        callbackUrl:
          this.configService.get<string>('ZARINPAL_CALLBACK_URL') ||
          'https://yourdomain.com/payment/callback',
        description: createDto.description,
        userId,
        orderId,
      });

      await this.transactionService.update(transaction.id, { authority }, session);

      await this.transactionService.commitSession(session);
      return { transaction, paymentUrl: url };
    } catch (error) {
      await this.transactionService.abortSession(session);
      throw new BadRequestException(error.message);
    } finally {
      session.endSession();
    }
  }

  async handleCallback(authority: string, status: string) {
    const session = await this.transactionService.startSession();
    try {
      const transaction = await this.transactionService.findOne(authority, session);
      if (!transaction) throw new NotFoundException('Transaction not found');

      if (status !== 'OK') {
        // پرداخت ناموفق: سفارش failed شود
        await this.ordersService.update({
          id: transaction.orderId,
          status: OrdersStatus.FAILED,
        }, session);
        throw new BadRequestException('Payment failed');
      }

      const verificationResult = await this.zarinpalService.verifyPayment({
        authority,
        amount: transaction.amount,
      });

      if (verificationResult.status !== '100') {
        // پرداخت تایید نشد: سفارش failed شود
        await this.ordersService.update({
          id: transaction.orderId,
          status: OrdersStatus.FAILED,
        }, session);
        throw new BadRequestException('Verification failed');
      }

      const updateDto = {
        ref_id: verificationResult.ref_id,
        status: TransactionStatus.COMPLETED,
        verifiedAt: new Date(),
      };

      const updatedTransaction = await this.transactionService.update(
        authority,
        updateDto,
        session,
      );

      await this.walletsService.debitWallet(
        {
          ownerId: transaction.userId,
          ownerType: WalletOwnerType.USER,
          amount: transaction.amount,
        },
        session,
      );
      await this.walletsService.creditWallet(
        {
          ownerId: 'INTERMEDIARY_ID',
          ownerType: WalletOwnerType.INTERMEDIARY,
          amount: transaction.amount,
        },
        session,
      );

      await this.ordersService.markAsPaid(transaction.orderId, session);

      await this.transactionService.commitSession(session);
      return updatedTransaction;
    } catch (error) {
      await this.transactionService.abortSession(session);
      throw new BadRequestException(error.message);
    } finally {
      session.endSession();
    }
  }
}
