import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './entities/order.entity';
import { OrderRepository } from './repositories/order.repository';
import { Model } from 'mongoose';

@Module({
  imports: [MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }])],
  controllers: [OrdersController],
  providers: [
    {
      provide: 'OrderRepository',
      useFactory: (paymentModel: Model<Order>) => {
        return new OrderRepository(paymentModel);
      },
      inject: [getModelToken(Order.name)],
    },
    OrdersService],
})
export class OrdersModule {}
