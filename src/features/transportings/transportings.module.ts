import { Module } from '@nestjs/common';
import { TransportingsService } from './transportings.service';
import { TransportingsController } from './transportings.controller';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from 'src/features/products/entities/product.entity';
import { TransportingRepository } from './repositories/transporting.repository';
import { Transporting, TransportingSchema } from './entities/transporting.entity';
import { Model } from 'mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Transporting.name, schema: TransportingSchema }])
  ],
  controllers: [TransportingsController],
  providers: [
    {
      provide: 'TransportingRepository',
      useFactory: (transactionModel: Model<Transporting>) => {
        return new TransportingRepository(transactionModel);
      }, 
      inject: [getModelToken(Transporting.name)],
    },
    TransportingsService],
})
export class TransportingsModule {}
