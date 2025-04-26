import { Inject, Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ITransactionRepository } from './repositories/transactions.repository';
import { Transaction } from './entities/transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @Inject('TransactionRepository') 
    private readonly transactionRepository: ITransactionRepository
  ) {}

  async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    return await this.transactionRepository.create(createTransactionDto);
  }

  async findAll(): Promise<Transaction[]> {
    return await this.transactionRepository.findAll();
  }

  async findOne(id: string): Promise<Transaction | null> {
    return await this.transactionRepository.findById(id);
  }

  async update(id: string, updateTransactionDto: UpdateTransactionDto): Promise<Transaction | null> {
    return await this.transactionRepository.update(id, updateTransactionDto);
  }

  async remove(id: string): Promise<boolean> {
    return await this.transactionRepository.delete(id);
  }
}
