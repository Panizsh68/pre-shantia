import { Injectable } from '@nestjs/common';
import { Wallet } from '../entities/wallet.entity';
import {
  IBaseCrudRepository,
  IBaseTransactionRepository,
} from 'src/libs/repository/interfaces/base-repo.interfaces';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';
import { WalletOwnerType } from '../enums/wallet-ownertype.enum';
import { ClientSession, Model, UpdateQuery } from 'mongoose';

export interface IWalletRepository
  extends IBaseCrudRepository<Wallet>,
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
    // Delegate to base repository implementation to avoid accidental recursion
    // Base method expects an UpdateQuery<T>, so cast to that specific type instead of using `any`.
    return super.updateById(id, updateData as UpdateQuery<Wallet>, session);
  }

  async startTransaction(): Promise<ClientSession> {
    return this.baseTransactionRepo.startTransaction();
  }

  async commitTransaction(session: ClientSession): Promise<void> {
    return this.baseTransactionRepo.commitTransaction(session);
  }

  async abortTransaction(session: ClientSession): Promise<void> {
    return this.baseTransactionRepo.abortTransaction(session);
  }
}
