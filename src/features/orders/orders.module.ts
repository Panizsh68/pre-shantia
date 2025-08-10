import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './entities/order.entity';
import { Model } from 'mongoose';
import { ProductsModule } from '../products/products.module';
import { WalletsModule } from '../wallets/wallets.module';
import { IOrderRepository, OrderRepository } from './repositories/order.repository';
import { CartsModule } from '../carts/carts.module';
import { OrderFactoryService } from './order-factory.service';
import { GenericRepositoryModule } from 'src/libs/repository/generic-repository.module';
import { BASE_TRANSACTION_REPOSITORY } from 'src/libs/repository/constants/tokens.constants';

@Module({
  imports: [
    GenericRepositoryModule.forFeature<Order>(Order.name, Order, OrderSchema),
    ProductsModule,
    WalletsModule,
    CartsModule,
  ],
  controllers: [OrdersController],
  providers: [
    {
      provide: 'OrderRepository',
      useFactory: (orderModel, transactionRepo): IOrderRepository => {
        return new OrderRepository(orderModel, transactionRepo);
      },
      inject: [getModelToken(Order.name), BASE_TRANSACTION_REPOSITORY],
    },
    {
      provide: 'IOrdersService',
      useClass: OrdersService,
    },
    OrderFactoryService,
  ],
  exports: ['IOrdersService', 'OrderRepository', GenericRepositoryModule], // Added GenericRepositoryModule to exports
})
export class OrdersModule { }
