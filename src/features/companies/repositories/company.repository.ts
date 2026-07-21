import { Injectable } from '@nestjs/common';
import { Model, ClientSession, PipelineStage } from 'mongoose';
import {
  IBaseCrudRepository,
  IBaseAggregateRepository,
  IBaseTransactionRepository,
} from 'src/libs/repository/interfaces/base-repo.interfaces';
import { Company } from '../entities/company.entity';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';

export interface ICompanyRepository
  extends IBaseCrudRepository<Company>,
    IBaseAggregateRepository<Company>,
    IBaseTransactionRepository<Company> {}

@Injectable()
export class CompanyRepository extends BaseCrudRepository<Company> implements ICompanyRepository {
  constructor(
    companyModel: Model<Company>,
    private readonly aggregateRepository: IBaseAggregateRepository<Company>,
    private readonly transactionRepository: IBaseTransactionRepository<Company>,
  ) {
    super(companyModel);
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
