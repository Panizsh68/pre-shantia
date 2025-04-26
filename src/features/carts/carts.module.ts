import { Module } from '@nestjs/common';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';
import { CartRepository } from './repositories/carts.repository';

@Module({
  controllers: [CartsController],
  providers: [
    {
      provide: 'CartRepository',
      useClass: CartRepository,
    },
    CartsService],
})
export class CartsModule {}
