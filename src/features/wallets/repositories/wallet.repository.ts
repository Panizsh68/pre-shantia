import { Injectable } from '@nestjs/common';
import { Wallet } from '../entities/wallet.entity';
import {
  IBaseCrudRepository,
  IBaseTransactionRepository,
} from 'src/libs/repository/interfaces/base-repo.interfaces';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';
import { WalletOwnerType } from '../enums/wallet-ownertype.enum';
import { ClientSession, Model } from 'mongoose';

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
    const updatedWallet = this.updateById(id, updateData, session);
    return updatedWallet;
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
