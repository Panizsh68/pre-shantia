import { Module } from '@nestjs/common';
import { TransportingsService } from './transportings.service';
import { TransportingsController } from './transportings.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from 'src/features/products/entities/product.entity';

@Module({
  imports: [MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])],
  controllers: [TransportingsController],
  providers: [TransportingsService],
})
export class TransportingsModule {}
