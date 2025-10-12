import { Module, forwardRef } from '@nestjs/common';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from './schema/transaction.schema';
import { TransactionService } from './transaction.service';
import { ZibalService } from 'src/utils/services/zibal/zibal.service';
import { ZibalModule } from 'src/utils/services/zibal/zibal.module';
import { Model } from 'mongoose';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';
import { IBaseCrudRepository } from 'src/libs/repository/interfaces/base-repo.interfaces';
// zarinpal removed; using Zibal only
import { GenericRepositoryModule } from 'src/libs/repository/generic-repository.module';
import { PermissionsModule } from 'src/features/permissions/permissions.module';
import {
  ITransactionRepository,
  TransactionRepository,
} from './repositories/transaction.repository';
import { BASE_TRANSACTION_REPOSITORY } from 'src/libs/repository/constants/tokens.constants';
import { TransactionController } from './transaction.controller';

@Module({
  imports: [
    GenericRepositoryModule.forFeature<Transaction>(
      Transaction.name,
      Transaction,
      TransactionSchema,
    ),
    // Register Zibal SDK.
    ZibalModule.register({
      merchant: process.env.ZIBAL_MERCHANT_ID || '68b44a2ca45c720011a852e0',
      callbackUrl: process.env.ZIBAL_CALLBACK_URL || 'http://localhost:3000/payment/callback',
      sandbox: (process.env.ZIBAL_SANDBOX || '').toLowerCase() === 'true',
      logLevel: parseInt(process.env.ZIBAL_LOG_LEVEL || '2', 10),
    }),
    forwardRef(() => PermissionsModule),
  ],
  providers: [
    ZibalService,
    {
      provide: 'TransactionRepository',
      useFactory: (transactionModel, transactionRepo): ITransactionRepository =>
        new TransactionRepository(transactionModel, transactionRepo),
      inject: [getModelToken(Transaction.name), BASE_TRANSACTION_REPOSITORY],
    },
    {
      provide: 'ITransactionsService',
      useClass: TransactionService,
    },
  ],
  exports: ['ITransactionsService', 'TransactionRepository'],
  controllers: [TransactionController],
})
export class TransactionModule { }
