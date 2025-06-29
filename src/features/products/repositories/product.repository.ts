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
  constructor(@InjectModel(Product.name) private readonly productModel: Model<Product>) {
    super(productModel);
  }

  async aggregate<R>(pipeline: PipelineStage[], session?: ClientSession): Promise<R[]> {
    try {
      return await this.model
        .aggregate(pipeline)
        .session(session ?? null)
        .exec();
    } catch (error) {
      throw new BadRequestException(`Aggregation failed: ${(error as Error).message}`);
    }
  }

  async startTransaction(): Promise<ClientSession> {
    const session = await this.model.db.startSession();
    return session;
  }

  async commitTransaction(session: ClientSession): Promise<void> {
    await session.commitTransaction();
  }

  async abortTransaction(session: ClientSession): Promise<void> {
    await session.abortTransaction();
  }
}
