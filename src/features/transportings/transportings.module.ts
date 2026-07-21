import { Module, forwardRef } from '@nestjs/common';
import { TransportService } from './transportings.service';
import { TransportController } from './transportings.controller';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Transporting, TransportingSchema } from './entities/transporting.entity';
import { Model } from 'mongoose';
import {
  ITransportingRepository,
  TransportingRepository,
} from './repositories/transporting.repository';
import { GenericRepositoryModule } from 'src/libs/repository/generic-repository.module';
import {
  BASE_AGGREGATE_REPOSITORY,
  BASE_TRANSACTION_REPOSITORY,
} from 'src/libs/repository/constants/tokens.constants';
import { PermissionsModule } from 'src/features/permissions/permissions.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    GenericRepositoryModule.forFeature<Transporting>(
      Transporting.name,
      Transporting,
      TransportingSchema,
    ),
    OrdersModule,
    forwardRef(() => PermissionsModule),
  ],
  controllers: [TransportController],
  providers: [
    {
      provide: 'TransportingRepository',
      useFactory: (transportingModel: Model<Transporting>, aggregateRepo, transactionRepo): ITransportingRepository => {
        return new TransportingRepository(transportingModel, aggregateRepo, transactionRepo);
      },
      inject: [getModelToken(Transporting.name), BASE_AGGREGATE_REPOSITORY, BASE_TRANSACTION_REPOSITORY],
    },
    {
      provide: 'ITransportService',
      useClass: TransportService,
    },
  ],
  exports: ['ITransportService'],
})
export class TransportModule { }
