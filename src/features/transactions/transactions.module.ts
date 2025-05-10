import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TransactionRepository } from './repositories/transactions.repository';
import { Model } from 'mongoose';
import { Transaction, TransactionSchema } from './entities/transaction.entity';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { TokensModule } from 'src/utils/services/tokens/tokens.module';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }]), TokensModule],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    {
      provide: 'TransactionRepository',
      useFactory: (transactionModel: Model<Transaction>) => {
        return new TransactionRepository(transactionModel);
      }, 
      inject: [getModelToken(Transaction.name)],
    },
    TokensService, JwtService],
    exports: ['TransactionRepository', TransactionsService]

})
export class TransactionsModule {}
