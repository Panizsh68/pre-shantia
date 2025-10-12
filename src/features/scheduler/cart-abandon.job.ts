import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CartStatus } from '../carts/enums/cart-status.enum';
import { ICartRepository } from '../carts/repositories/carts.repository';

@Injectable()
export class CartAbandonJob {
  private readonly logger = new Logger(CartAbandonJob.name);

  constructor(@Inject('CartRepository') private readonly cartRepository: ICartRepository) { }

  // Runs every day at 2:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleAbandonCarts() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const modified = await this.cartRepository.markAbandonedBefore(oneWeekAgo);
    if (modified > 0) {
      this.logger.log(`Abandoned ${modified} carts.`);
    }
  }
}
