import {
  IBaseCrudRepository,
  IBaseAggregateRepository,
  IBaseTransactionRepository,
} from 'src/libs/repository/interfaces/base-repo.interfaces';
import { Transaction } from '../schema/transaction.schema';
import { Model, PipelineStage } from 'mongoose';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';
import { Injectable } from '@nestjs/common';
import { ClientSession } from 'mongoose';
import { toMongooseSession } from 'src/libs/repository/session-utils';

export interface ITransactionRepository
  extends IBaseCrudRepository<Transaction>,
    IBaseAggregateRepository<Transaction>,
    IBaseTransactionRepository<Transaction> {
  findOneByTrackIdAndStatusAndUpdate(
    trackId: string,
    expectedStatus: any,
    update: any,
    session?: ClientSession,
  ): Promise<Transaction | null>;
}

@Injectable()
export class TransactionRepository
  extends BaseCrudRepository<Transaction>
  implements ITransactionRepository
{
  constructor(
    private readonly transactionModel: Model<Transaction>,
    private readonly aggregateRepository: IBaseAggregateRepository<Transaction>,
    private readonly transactionRepository: IBaseTransactionRepository<Transaction>,
  ) {
    super(transactionModel);
  }

  async aggregate<R = any>(pipeline: PipelineStage[], session?: ClientSession): Promise<R[]> {
    return this.aggregateRepository.aggregate<R>(pipeline, session);
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

  async findOneByTrackIdAndStatusAndUpdate(
    trackId: string,
    expectedStatus: any,
    update: any,
    session?: ClientSession,
  ): Promise<Transaction | null> {
    const statusQuery = Array.isArray(expectedStatus) ? { $in: expectedStatus } : expectedStatus;
    return this.transactionModel
      .findOneAndUpdate({ trackId, status: statusQuery }, update, { new: true })
      .session(toMongooseSession(session))
      .exec();
  }
}
