import {
  IBaseCrudRepository,
  IBaseTransactionRepository,
} from 'src/libs/repository/interfaces/base-repo.interfaces';
import { Transaction } from '../schema/transaction.schema';
import { Model } from 'mongoose';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';
import { Injectable } from '@nestjs/common';
import { ClientSession } from 'mongoose';
import { toMongooseSession } from 'src/libs/repository/session-utils';

export interface ITransactionRepository
  extends IBaseCrudRepository<Transaction>,
  IBaseTransactionRepository<Transaction> { }

@Injectable()
export class TransactionRepository
  extends BaseCrudRepository<Transaction>
  implements ITransactionRepository {
  constructor(
    private readonly userModel: Model<Transaction>,
    private readonly transactionRepository: IBaseTransactionRepository<Transaction>,
  ) {
    super(userModel);
  }
  async startTransaction(): Promise<ClientSession> {
    return this.transactionRepository.startTransaction();
  }

  async commitTransaction(session: ClientSession): Promise<void> {
    return this.transactionRepository.commitTransaction(session);
  }

  async abortTransaction(session: ClientSession): Promise<void> {
    return this.transactionRepository.abortTransaction(session);
  }

  // Atomically update a transaction only if it matches an expected status.
  async findOneByTrackIdAndStatusAndUpdate(
    trackId: string,
    expectedStatus: any,
    update: any,
    session?: ClientSession,
  ): Promise<Transaction | null> {
    const statusQuery = Array.isArray(expectedStatus) ? { $in: expectedStatus } : expectedStatus;
    return this.userModel
      .findOneAndUpdate({ trackId, status: statusQuery }, update, { new: true })
      .session(toMongooseSession(session))
      .exec();
  }
}
