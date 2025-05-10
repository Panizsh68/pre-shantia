import { Inject, Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ITransactionRepository } from './repositories/transactions.repository';
import { Transaction } from './entities/transaction.entity';
import { QueryOptionsDto } from 'src/utils/query-options.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @Inject('TransactionRepository') 
    private readonly transactionRepository: ITransactionRepository
  ) {}

  async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    return await this.transactionRepository.create(createTransactionDto);
  }

  async getTransactions(userId: string): Promise<Transaction[]> {
    return this.transactionRepository.findAll({sortBy: userId});
  }

}
