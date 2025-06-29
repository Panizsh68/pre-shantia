import { Module } from '@nestjs/common';
import { TransportingsService } from './transportings.service';
import { TransportingsController } from './transportings.controller';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Transporting, TransportingSchema } from './entities/transporting.entity';
import { Model } from 'mongoose';
import {
  ITransportingRepository,
  TransportingRepository,
} from './repositories/transporting.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: Transporting.name, schema: TransportingSchema }])],
  controllers: [TransportingsController],
  providers: [
    {
      provide: 'TransportingRepository',
      useFactory: (transportingModel: Model<Transporting>): ITransportingRepository => {
        return new TransportingRepository(transportingModel);
      },
      inject: [getModelToken(Transporting.name)],
    },
    TransportingsService,
  ],
})
export class TransportingsModule {}
