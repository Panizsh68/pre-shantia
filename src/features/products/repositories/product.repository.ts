import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession, PipelineStage } from 'mongoose';
import { Product } from '../entities/product.entity';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';
import {
  IBaseCrudRepository,
  IBaseAggregateRepository,
  IBaseTransactionRepository,
} from 'src/libs/repository/interfaces/base-repo.interfaces';

export interface IProductRepository
  extends IBaseCrudRepository<Product>,
    IBaseAggregateRepository<Product>,
    IBaseTransactionRepository<Product> {}

@Injectable()
export class ProductRepository extends BaseCrudRepository<Product> implements IProductRepository {
  constructor(
    productModel: Model<Product>,
    private readonly aggregateRepository: IBaseAggregateRepository<Product>,
    private readonly transactionRepository: IBaseTransactionRepository<Product>,
  ) {
    super(productModel);
  }

  async aggregate<R>(pipeline: PipelineStage[], session?: ClientSession): Promise<R[]> {
    try {
      return await this.aggregateRepository.aggregate(pipeline, session);
    } catch (error) {
      throw new BadRequestException(`Aggregation failed: ${(error as Error).message}`);
    }
  }

  async startTransaction(): Promise<ClientSession> {
    const session = await this.transactionRepository.startTransaction();
    return session;
  }

  async commitTransaction(session: ClientSession): Promise<void> {
    await this.transactionRepository.commitTransaction(session);
  }

  async abortTransaction(session: ClientSession): Promise<void> {
    await this.transactionRepository.abortTransaction(session);
  }
}
