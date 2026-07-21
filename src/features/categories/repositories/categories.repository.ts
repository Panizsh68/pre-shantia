import { Injectable } from '@nestjs/common';
import { Model, ClientSession, PipelineStage } from 'mongoose';
import {
  IBaseCrudRepository,
  IBaseAggregateRepository,
  IBaseTransactionRepository,
} from 'src/libs/repository/interfaces/base-repo.interfaces';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';
import { ICategory } from '../interfaces/category.interface';

export interface ICategoryRepository
  extends IBaseCrudRepository<ICategory>,
    IBaseAggregateRepository<ICategory>,
    IBaseTransactionRepository<ICategory> {}

@Injectable()
export class CategoryRepository
  extends BaseCrudRepository<ICategory>
  implements ICategoryRepository
{
  constructor(
    categoryModel: Model<ICategory>,
    private readonly aggregateRepository: IBaseAggregateRepository<ICategory>,
    private readonly transactionRepository: IBaseTransactionRepository<ICategory>,
  ) {
    super(categoryModel);
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
