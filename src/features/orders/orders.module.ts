import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './entities/order.entity';
import { Model } from 'mongoose';
import { ProductsModule } from '../products/products.module';
import { WalletsModule } from '../wallets/wallets.module';
import { IOrderRepository, OrderRepository } from './repositories/order.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    ProductsModule,
    WalletsModule,
  ],
  controllers: [OrdersController],
  providers: [
    {
      provide: 'OrderRepository',
      useFactory: (orderModel: Model<Order>): IOrderRepository => {
        return new OrderRepository(orderModel);
      },
      inject: [getModelToken(Order.name)],
    },
    {
      provide: 'IOrdersService',
      useClass: OrdersService,
    },
  ],
  exports: ['IOrdersService', 'OrderRepository'],
})
export class OrdersModule {}
