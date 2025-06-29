import { Module } from '@nestjs/common';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from './schema/transaction.schema';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { ZarinpalService } from 'src/utils/services/zarinpal/zarinpal.service';
import { Model } from 'mongoose';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';
import { IBaseCrudRepository } from 'src/libs/repository/interfaces/base-repo.interfaces';

@Module({
  imports: [MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }])],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    ZarinpalService,
    {
      provide: 'TransactionRepository',
      useFactory: (TransactionModel: Model<Transaction>): IBaseCrudRepository<Transaction> =>
        new BaseCrudRepository<Transaction>(TransactionModel),
      inject: [getModelToken(Transaction.name)],
    },
    {
      provide: 'ITransactionsService',
      useClass: TransactionService,
    },
  ],
  exports: ['ITransactionsService', 'TransactionRepository'],
})
export class TransactionModule {}
