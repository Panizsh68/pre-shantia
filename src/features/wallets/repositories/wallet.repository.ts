import { Injectable } from '@nestjs/common';
import { Wallet } from '../entities/wallet.entity';
import {
  IBaseCrudRepository,
  IBaseAggregateRepository,
  IBaseTransactionRepository,
} from 'src/libs/repository/interfaces/base-repo.interfaces';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';
import { WalletOwnerType } from '../enums/wallet-ownertype.enum';
import { ClientSession, Model, UpdateQuery, PipelineStage } from 'mongoose';

export interface IWalletRepository
  extends IBaseCrudRepository<Wallet>,
    IBaseAggregateRepository<Wallet>,
    IBaseTransactionRepository<Wallet> {
  findByIdAndType(
    ownerId: string,
    ownerType: WalletOwnerType,
    session?: ClientSession,
  ): Promise<Wallet | null>;
}

@Injectable()
export class WalletRepository extends BaseCrudRepository<Wallet> implements IWalletRepository {
  constructor(
    walletModel: Model<Wallet>,
    private readonly aggregateRepository: IBaseAggregateRepository<Wallet>,
    private readonly baseTransactionRepo: IBaseTransactionRepository<Wallet>,
  ) {
    super(walletModel);
  }

  async findByIdAndType(
    ownerId: string,
    ownerType: WalletOwnerType,
    session?: ClientSession,
  ): Promise<Wallet | null> {
    return this.findOneByCondition({ ownerId, ownerType }, { session });
  }

  async updateById(
    id: string,
    updateData: Partial<Wallet>,
    session?: ClientSession,
  ): Promise<Wallet> {
    return super.updateById(id, updateData as UpdateQuery<Wallet>, session);
  }

  async aggregate<R = any>(pipeline: PipelineStage[], session?: ClientSession): Promise<R[]> {
    return this.aggregateRepository.aggregate<R>(pipeline, session);
  }

  async startTransaction(): Promise<ClientSession> {
    return this.baseTransactionRepo.startTransaction();
  }

  async commitTransaction(session: ClientSession): Promise<void> {
    await this.baseTransactionRepo.commitTransaction(session);
  }

  async abortTransaction(session: ClientSession): Promise<void> {
    await this.baseTransactionRepo.abortTransaction(session);
  }
}
