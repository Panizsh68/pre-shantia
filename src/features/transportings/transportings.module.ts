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
import { GenericRepositoryModule } from 'src/libs/repository/generic-repository.module';
import { BASE_TRANSACTION_REPOSITORY } from 'src/libs/repository/constants/tokens.constants';

@Module({
  imports: [
    GenericRepositoryModule.forFeature<Transporting>(
      Transporting.name,
      Transporting,
      TransportingSchema,
    ),
  ],
  controllers: [TransportingsController],
  providers: [
    {
      provide: 'TransportingRepository',
      useFactory: (transportingModel, transactionRepo): ITransportingRepository => {
        return new TransportingRepository(transportingModel, transactionRepo);
      },
      inject: [getModelToken(Transporting.name), BASE_TRANSACTION_REPOSITORY],
    },
    {
      provide: 'ITransportingsService',
      useClass: TransportingsService,
    },
  ],
})
export class TransportingsModule {}
