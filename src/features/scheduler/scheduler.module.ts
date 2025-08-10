import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, CartSchema } from '../carts/entities/cart.entity';
import { CartAbandonJob } from './cart-abandon.job';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([{ name: Cart.name, schema: CartSchema }]),
  ],
  providers: [CartAbandonJob],
})
export class SchedulerModule { }
