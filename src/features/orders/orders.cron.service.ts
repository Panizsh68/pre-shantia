import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { IOrdersService } from './interfaces/order.service.interface';
import { IWalletService } from '../wallets/interfaces/wallet.service.interface';
import { OrdersStatus } from './enums/orders.status.enum';
import { WalletOwnerType } from '../wallets/enums/wallet-ownertype.enum';
import { IOrderRepository } from './repositories/order.repository';
import { getIntermediaryWalletId } from 'src/utils/intermediary-wallet.util';

@Injectable()
export class OrderCronService {
  constructor(
    @Inject('OrderRepository') private readonly orderRepository: IOrderRepository,
    @Inject('IOrdersService') private readonly ordersService: IOrdersService,
    @Inject('IWalletsService') private readonly walletsService: IWalletService,
  ) { }

  @Cron('0 0 */1 * * *')
  async handleExpiredOrders(): Promise<void> {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const orders = await this.ordersService.find({
      where: {
        status: OrdersStatus.DELIVERED,
        deliveredAt: { $lte: threeDaysAgo },
        confirmedAt: null,
        $or: [
          { ticketId: null },
          { ticketId: { $exists: false } },
        ],
      },
    });

    for (const order of orders) {
      const session = await this.orderRepository.startTransaction();
      try {
        const updateData = { status: OrdersStatus.COMPLETED, confirmedAt: new Date() };
        await this.ordersService.update({ id: order.id, ...updateData }, session);

        const intermediaryId = getIntermediaryWalletId();
        await this.walletsService.releaseBlockedAmount(
          { ownerId: intermediaryId, ownerType: WalletOwnerType.INTERMEDIARY },
          { ownerId: order.companyId.toString(), ownerType: WalletOwnerType.COMPANY },
          order.totalPrice,
          { orderId: order.id.toString(), type: 'TRANSFER', reason: 'auto_release_after_3_days' },
          session,
        );

        await this.orderRepository.commitTransaction(session);
      } catch (error) {
        await this.orderRepository.abortTransaction(session);
        throw new Error(error);
      }
    }
  }
}
