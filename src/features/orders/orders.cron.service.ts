import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IOrdersService } from './interfaces/order.service.interface';
import { IWalletService } from '../wallets/interfaces/wallet.service.interface';
import { OrdersStatus } from './enums/orders.status.enum';
import { WalletOwnerType } from '../wallets/enums/wallet-ownertype.enum';
import { IOrderRepository } from './repositories/order.repository';
import { IProductRepository } from '../products/repositories/product.repository';
import { getIntermediaryWalletId } from 'src/utils/intermediary-wallet.util';
import { Types } from 'mongoose';

@Injectable()
export class OrderCronService {
  constructor(
    @Inject('OrderRepository') private readonly orderRepository: IOrderRepository,
    @Inject('ProductRepository') private readonly productRepository: IProductRepository,
    @Inject('IOrdersService') private readonly ordersService: IOrdersService,
    @Inject('IWalletsService') private readonly walletsService: IWalletService,
  ) { }

  /**
   * Auto-complete orders that have been DELIVERED for more than 3 days.
   */
  @Cron(CronExpression.EVERY_HOUR)
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
        const freshOrder = await this.orderRepository.findById(order.id, { session });
        if (!freshOrder || freshOrder.status !== OrdersStatus.DELIVERED) {
          await this.orderRepository.abortTransaction(session);
          continue;
        }

        const updateData = { status: OrdersStatus.COMPLETED, confirmedAt: new Date() };
        await this.ordersService.update({ id: order.id, ...updateData } as any, session);

        const intermediaryId = getIntermediaryWalletId();
        const correlationId = `release-order-${order.id}`;
        
        await this.walletsService.releaseBlockedAmount(
          { ownerId: intermediaryId, ownerType: WalletOwnerType.INTERMEDIARY },
          { ownerId: order.companyId.toString(), ownerType: WalletOwnerType.COMPANY },
          order.totalPrice,
          { 
            orderId: order.id.toString(), 
            type: 'TRANSFER', 
            reason: 'auto_release_after_3_days',
            correlationId 
          },
          session,
        );

        await this.orderRepository.commitTransaction(session);
      } catch (error) {
        await this.orderRepository.abortTransaction(session);
        console.error(`Cron: Failed to auto-confirm order ${order.id}:`, error.message);
      }
    }
  }

  /**
   * B1: Stock Reversion for Expired Pending Orders.
   * Finds orders that remained PENDING (unpaid) for more than 30 minutes,
   * marks them as FAILED and returns the reserved stock back to products.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiredPendingOrders(): Promise<void> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const expiredOrders = await this.orderRepository.findManyByCondition({
      status: OrdersStatus.PENDING,
      createdAt: { $lte: thirtyMinutesAgo },
    });

    for (const order of expiredOrders) {
      const session = await this.orderRepository.startTransaction();
      try {
        // Double check status in transaction to prevent race conditions
        const freshOrder = await this.orderRepository.findById(order.id, { session });
        if (!freshOrder || freshOrder.status !== OrdersStatus.PENDING) {
          await this.orderRepository.abortTransaction(session);
          continue;
        }

        // 1. Mark order as FAILED
        await this.orderRepository.updateById(order.id, { status: OrdersStatus.FAILED }, session);

        // 2. Prepare stock items to increment back
        const stockItems = order.items.map(item => ({
          productId: new Types.ObjectId(item.productId),
          qty: item.quantity,
        }));

        // 3. ATOMIC STOCK REVERSION
        if (stockItems.length > 0) {
          await this.productRepository.bulkIncrementStock(stockItems, session);
        }

        await this.orderRepository.commitTransaction(session);
        console.log(`Cron: Expired PENDING order ${order.id} marked as FAILED and stock reverted.`);
      } catch (error) {
        await this.orderRepository.abortTransaction(session);
        console.error(`Cron: Failed to revert stock for expired order ${order.id}:`, error.message);
      }
    }
  }
}
