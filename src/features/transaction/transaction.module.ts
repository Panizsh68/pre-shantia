import { Module, forwardRef } from '@nestjs/common';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from './schema/transaction.schema';
import { TransactionService } from './transaction.service';
import { ZarinpalService } from 'src/utils/services/zarinpal/zarinpal.service';
import { Model } from 'mongoose';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';
import { IBaseCrudRepository } from 'src/libs/repository/interfaces/base-repo.interfaces';
import { ZarinpalModule } from 'src/utils/services/zarinpal/zarinpal.module';
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
    ZarinpalModule.register({
      merchantId: process.env.ZARINPAL_MERCHANT_ID || 'a3c16110-f184-44e2-ad26-649387845a94',
      sandbox: true,
    }),
    forwardRef(() => PermissionsModule),
  ],
  providers: [
    ZarinpalService,
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
