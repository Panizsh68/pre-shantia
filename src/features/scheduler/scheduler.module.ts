import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CartAbandonJob } from './cart-abandon.job';
import { CartsModule } from '../carts/carts.module';

@Module({
  imports: [ScheduleModule.forRoot(), CartsModule],
  providers: [CartAbandonJob],
})
export class SchedulerModule { }
