import { Module } from '@nestjs/common';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';
import { Cart, CartSchema } from './entities/cart.entity';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';
import { Model } from 'mongoose';
import { IBaseCrudRepository } from 'src/libs/repository/interfaces/base-repo.interfaces';

@Module({
  imports: [MongooseModule.forFeature([{ name: Cart.name, schema: CartSchema }])],
  controllers: [CartsController],
  providers: [
    CartsService,
    {
      provide: 'CartRepository',
      useFactory: (cartModel: Model<Cart>): IBaseCrudRepository<Cart> =>
        new BaseCrudRepository<Cart>(cartModel),
      inject: [getModelToken(Cart.name)],
    },
  ],
})
export class CartsModule {}
