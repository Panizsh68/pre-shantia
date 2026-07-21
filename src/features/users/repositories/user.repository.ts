import { Injectable } from '@nestjs/common';
import { Model, ClientSession, PipelineStage } from 'mongoose';
import { User } from '../entities/user.entity';
import {
  IBaseCrudRepository,
  IBaseAggregateRepository,
  IBaseTransactionRepository,
} from 'src/libs/repository/interfaces/base-repo.interfaces';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';

export interface IUserRepository
  extends IBaseCrudRepository<User>,
    IBaseAggregateRepository<User>,
    IBaseTransactionRepository<User> {
  findByPhoneNumber(phoneNumber: string): Promise<User | null>;
}

@Injectable()
export class UserRepository extends BaseCrudRepository<User> implements IUserRepository {
  constructor(
    userModel: Model<User>,
    private readonly aggregateRepository: IBaseAggregateRepository<User>,
    private readonly transactionRepository: IBaseTransactionRepository<User>,
  ) {
    super(userModel);
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return this.findOneByCondition({ phoneNumber });
  }

  async aggregate<R = any>(pipeline: PipelineStage[], session?: ClientSession): Promise<R[]> {
    return this.aggregateRepository.aggregate<R>(pipeline, session);
  }

  async startTransaction(): Promise<ClientSession> {
    return this.transactionRepository.startTransaction();
  }

  async commitTransaction(session: ClientSession): Promise<void> {
    await this.transactionRepository.commitTransaction(session);
  }

  async abortTransaction(session: ClientSession): Promise<void> {
    await this.transactionRepository.abortTransaction(session);
  }
}
