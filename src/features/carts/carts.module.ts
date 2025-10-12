// carts.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';
import { ProductsModule } from '../products/products.module';
import { PermissionsModule } from 'src/features/permissions/permissions.module';
import { Cart, CartSchema } from './entities/cart.entity';
import { getModelToken } from '@nestjs/mongoose';
import {
  BASE_POPULATE_REPOSITORY,
  BASE_AGGREGATE_REPOSITORY,
} from 'src/libs/repository/constants/tokens.constants';
import { CartRepository, ICartRepository } from './repositories/carts.repository';
import { GenericRepositoryModule } from 'src/libs/repository/generic-repository.module';

@Module({
  imports: [GenericRepositoryModule.forFeature<Cart>(Cart.name, Cart, CartSchema), ProductsModule, forwardRef(() => PermissionsModule)],
  controllers: [CartsController],
  providers: [
    {
      provide: 'CartRepository',
      useFactory: (cartModel, populateRepo, aggregateRepo): ICartRepository =>
        new CartRepository(cartModel, populateRepo, aggregateRepo),
      inject: [getModelToken(Cart.name), BASE_POPULATE_REPOSITORY, BASE_AGGREGATE_REPOSITORY],
    },
    {
      provide: 'ICartsService',
      useClass: CartsService,
    },
  ],
  exports: ['ICartsService', 'CartRepository'],
})
export class CartsModule { }
