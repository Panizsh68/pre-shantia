import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientSession } from 'mongoose';
import { Transaction } from './schema/transaction.schema';
import { CreateTransactionDto } from './dtos/create-transaction.dto';
import { ITransactionRepository } from './repositories/transaction.repository';
import { ITransactionService } from './interfaces/transaction.service.interface';

@Injectable()
export class TransactionService implements ITransactionService {
  constructor(
    @Inject('TransactionRepository') private readonly transactionRepository: ITransactionRepository,
  ) {}

  async create(
    createTransactionDto: CreateTransactionDto,
    session?: ClientSession,
  ): Promise<Transaction> {
    const transaction = await this.transactionRepository.createOne(createTransactionDto, session);
    return transaction;
  }

  async findOne(authority: string, session?: ClientSession): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOneByCondition(
      { authority },
      { session },
    );
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

  async update(authority: string, updateData: Partial<CreateTransactionDto>): Promise<Transaction> {
    const transaction = await this.transactionRepository.updateOneByCondition(
      { authority },
      { $set: updateData },
      { new: true },
    );
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

  async startSession(): Promise<ClientSession> {
    const session = await this.transactionRepository.startTransaction();
    return session;
  }

  async commitSession(session: ClientSession): Promise<void> {
    await this.transactionRepository.commitTransaction(session);
  }

  async abortSession(session: ClientSession): Promise<void> {
    await this.transactionRepository.abortTransaction(session);
  }
}
