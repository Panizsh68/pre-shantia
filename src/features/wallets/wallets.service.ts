import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreditWalletDto } from './dto/credit-wallet.dto';
import { IWalletService } from './interfaces/wallet.service.interface';
import { IWalletRepository } from './repositories/wallet.repository';
import { DebitWalletDto } from './dto/debit-wallet.dto';
import { WalletOwnerType } from './enums/wallet-ownertype.enum';
import { GetWalletDto } from './dto/get-wallet.dto';
import { ClientSession } from 'mongoose';
import { Wallet } from './entities/wallet.entity';
import { v4 as uuidv4 } from 'uuid';
import { TransactionStatus } from '../transaction/enums/transaction.status.enum';
import { CreateTransactionDto } from '../transaction/dtos/create-transaction.dto';
import { ITransactionService } from '../transaction/interfaces/transaction.service.interface';

@Injectable()
export class WalletsService implements IWalletService {
  async createWallet(data: { ownerId: string; ownerType: string; balance?: number; currency?: string }, session?: ClientSession): Promise<Wallet> {
    return await this.walletRepository.createOne({
      ownerId: data.ownerId,
      ownerType: data.ownerType,
      balance: data.balance ?? 0,
      currency: data.currency ?? 'IRR',
    }, session);
  }
  constructor(
    @Inject('WalletRepository') private readonly walletRepository: IWalletRepository,
    @Inject('ITransactionsService') private readonly transactionService: ITransactionService,
  ) { }

  async creditWallet(creditWalletDto: CreditWalletDto, session?: ClientSession): Promise<Wallet> {
    const transactionSession = session || (await this.walletRepository.startTransaction());
    try {
      const wallet = await this.walletRepository.findByIdAndType(
        creditWalletDto.ownerId,
        creditWalletDto.ownerType,
        transactionSession,
      );
      if (!wallet) {
        throw new NotFoundException(`Wallet not found for owner ${creditWalletDto.ownerId}`);
      }

      wallet.balance += creditWalletDto.amount;
      const updatedWallet = await this.walletRepository.updateById(
        wallet.id,
        { balance: wallet.balance },
        transactionSession,
      );

      // create transaction record for credit
      const txDto: CreateTransactionDto = {
        authority: uuidv4(),
        amount: creditWalletDto.amount,
        description: `Credit to wallet ${wallet.id}`,
        mobile: undefined,
        email: undefined,
        userId: creditWalletDto.ownerId,
        status: TransactionStatus.COMPLETED,
        createdAt: new Date(),
        toWalletId: wallet.id,
        resultingBalance: updatedWallet.balance,
        counterpartyOwnerId: undefined,
        counterpartyOwnerType: undefined,
        metadata: { reason: 'credit' },
      };
      await this.transactionService.create(txDto, transactionSession);
      if (!session) {
        await this.walletRepository.commitTransaction(transactionSession);
      }
      return updatedWallet;
    } catch (error) {
      if (!session) {
        await this.walletRepository.abortTransaction(transactionSession);
      }
      throw new BadRequestException(`Failed to credit wallet: ${error.message}`);
    }
  }

  async debitWallet(debitWalletDto: DebitWalletDto, session?: ClientSession): Promise<Wallet> {
    const transactionSession = session || (await this.walletRepository.startTransaction());
    try {
      const wallet = await this.walletRepository.findByIdAndType(
        debitWalletDto.ownerId,
        debitWalletDto.ownerType,
        transactionSession,
      );
      if (!wallet) {
        throw new NotFoundException(`Wallet not found for owner ${debitWalletDto.ownerId}`);
      }
      if (wallet.balance < debitWalletDto.amount) {
        throw new BadRequestException('Insufficient balance');
      }

      wallet.balance -= debitWalletDto.amount;
      const updatedWallet = await this.walletRepository.updateById(
        wallet.id,
        { balance: wallet.balance },
        transactionSession,
      );

      // create transaction record for debit
      const txDto: CreateTransactionDto = {
        authority: uuidv4(),
        amount: debitWalletDto.amount,
        description: `Debit from wallet ${wallet.id}`,
        mobile: undefined,
        email: undefined,
        userId: debitWalletDto.ownerId,
        status: TransactionStatus.COMPLETED,
        createdAt: new Date(),
        fromWalletId: wallet.id,
        resultingBalance: updatedWallet.balance,
        metadata: { reason: 'debit' },
      };
      await this.transactionService.create(txDto, transactionSession);
      if (!session) {
        await this.walletRepository.commitTransaction(transactionSession);
      }
      return updatedWallet;
    } catch (error) {
      if (!session) {
        await this.walletRepository.abortTransaction(transactionSession);
      }
      throw new BadRequestException(`Failed to debit wallet: ${error.message}`);
    }
  }

  async transfer(
    from: { ownerId: string; ownerType: WalletOwnerType },
    to: { ownerId: string; ownerType: WalletOwnerType },
    amount: number,
    session?: ClientSession,
  ): Promise<void> {
    const transactionSession = session || (await this.walletRepository.startTransaction());
    try {
      const fromWallet = await this.walletRepository.findByIdAndType(
        from.ownerId,
        from.ownerType,
        transactionSession,
      );
      const toWallet = await this.walletRepository.findByIdAndType(
        to.ownerId,
        to.ownerType,
        transactionSession,
      );

      if (!fromWallet || !toWallet) {
        throw new NotFoundException('Wallet not found');
      }
      if (fromWallet.balance < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      fromWallet.balance -= amount;
      toWallet.balance += amount;

      await this.walletRepository.updateById(
        fromWallet.id,
        { balance: fromWallet.balance },
        transactionSession,
      );
      await this.walletRepository.updateById(toWallet.id, { balance: toWallet.balance }, transactionSession);

      // create transaction record for transfer (one record representing this transfer)
      const txDto: CreateTransactionDto = {
        authority: uuidv4(),
        amount,
        description: `Transfer from ${from.ownerId} to ${to.ownerId}`,
        mobile: undefined,
        email: undefined,
        userId: from.ownerId,
        status: TransactionStatus.COMPLETED,
        createdAt: new Date(),
        fromWalletId: fromWallet.id,
        toWalletId: toWallet.id,
        resultingBalance: fromWallet.balance,
        resultingBalanceTo: toWallet.balance,
        counterpartyOwnerId: to.ownerId,
        counterpartyOwnerType: to.ownerType,
        metadata: { reason: 'transfer' },
      };
      await this.transactionService.create(txDto, transactionSession);

      if (!session) {
        await this.walletRepository.commitTransaction(transactionSession);
      }
    } catch (error) {
      if (!session) {
        await this.walletRepository.abortTransaction(transactionSession);
      }
      throw new BadRequestException(`Transfer failed: ${error.message}`);
    }
  }

  async getWallet(getWalletDto: GetWalletDto, session?: ClientSession): Promise<Wallet> {
    const { ownerId, ownerType } = getWalletDto;

    if (!ownerType) {
      throw new BadRequestException('ownerType is required');
    }

    let wallet = await this.walletRepository.findByIdAndType(ownerId, ownerType, session);

    if (!wallet) {
      // Lazy creation: create wallet with initial values
      wallet = await this.walletRepository.createOne({
        ownerId,
        ownerType,
        balance: 0,
        currency: 'IRR',
      });
    }

    return wallet;
  }
}
