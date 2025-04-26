import { Module } from '@nestjs/common';
import { TransportingsService } from './transportings.service';
import { TransportingsController } from './transportings.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from 'src/features/products/entities/product.entity';
import { TransportingRepository } from './repositories/transporting.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])
  ],
  controllers: [TransportingsController],
  providers: [
    {
      provide: 'TransportingRepository',
      useClass: TransportingRepository,
    },
    TransportingsService],
})
export class TransportingsModule {}
