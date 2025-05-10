import { Module } from '@nestjs/common';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';
import { CartRepository } from './repositories/carts.repository';
import { Model } from 'mongoose';
import { Cart, CartSchema } from './entities/cart.entity';
import { BaseRepository } from 'src/utils/base.repository';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Cart.name, schema: CartSchema }]),
  ],
  controllers: [CartsController],
  providers: [
    CartsService,
    {
      provide: 'CartRepository',
      useFactory: (cartModel: Model<Cart>) => new BaseRepository<Cart>(cartModel),
      inject: [getModelToken(Cart.name)],
    },
  ],
})
export class CartsModule {}
