import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart } from '../carts/entities/cart.entity';
import { CartStatus } from '../carts/enums/cart-status.enum';

@Injectable()
export class CartAbandonJob {
  private readonly logger = new Logger(CartAbandonJob.name);

  constructor(@InjectModel(Cart.name) private readonly cartModel: Model<Cart>) { }

  // Runs every day at 2:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleAbandonCarts() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await this.cartModel.updateMany(
      {
        status: CartStatus.ACTIVE,
        createdAt: { $lte: oneWeekAgo },
      },
      { $set: { status: CartStatus.ABANDONED } },
    );
    if (result.modifiedCount > 0) {
      this.logger.log(`Abandoned ${result.modifiedCount} carts.`);
    }
  }
}
