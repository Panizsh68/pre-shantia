import { Module, forwardRef } from '@nestjs/common';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from './schema/transaction.schema';
import { TransactionService } from './transaction.service';
import { ZibalService } from 'src/utils/services/zibal/zibal.service';
import { ZibalModule } from 'src/utils/services/zibal/zibal.module';
import { Model } from 'mongoose';
import { GenericRepositoryModule } from 'src/libs/repository/generic-repository.module';
import { PermissionsModule } from 'src/features/permissions/permissions.module';
import {
  ITransactionRepository,
  TransactionRepository,
} from './repositories/transaction.repository';
import {
  BASE_AGGREGATE_REPOSITORY,
  BASE_TRANSACTION_REPOSITORY,
} from 'src/libs/repository/constants/tokens.constants';
import { TransactionController } from './transaction.controller';

function requiredTransactionEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required transaction environment variable: ${name}`);
  }
  return value || '';
}

@Module({
  imports: [
    GenericRepositoryModule.forFeature<Transaction>(
      Transaction.name,
      Transaction,
      TransactionSchema,
    ),
    ZibalModule.register({
      merchant: requiredTransactionEnv('ZIBAL_MERCHANT_ID'),
      callbackUrl: requiredTransactionEnv('ZIBAL_CALLBACK_URL'),
      sandbox: (process.env.ZIBAL_SANDBOX || '').trim().toLowerCase() === 'true',
      logLevel: parseInt(process.env.ZIBAL_LOG_LEVEL || '2', 10),
    }),
    forwardRef(() => PermissionsModule),
  ],
  providers: [
    ZibalService,
    {
      provide: 'TransactionRepository',
      useFactory: (transactionModel: Model<Transaction>, aggregateRepo, transactionRepo): ITransactionRepository =>
        new TransactionRepository(transactionModel, aggregateRepo, transactionRepo),
      inject: [getModelToken(Transaction.name), BASE_AGGREGATE_REPOSITORY, BASE_TRANSACTION_REPOSITORY],
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
