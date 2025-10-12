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
import { runInTransaction } from 'src/libs/repository/run-in-transaction';
import { TransactionStatus } from '../transaction/enums/transaction.status.enum';
import { TransactionType } from '../transaction/enums/transaction.type.enum';
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
    return runInTransaction(this.walletRepository, async (transactionSession) => {
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
        trackId: uuidv4(),
        amount: creditWalletDto.amount,
        description: `Credit to wallet ${wallet.id}`,
        mobile: undefined,
        email: undefined,
        userId: creditWalletDto.ownerId,
        status: TransactionStatus.COMPLETED,
        type: TransactionType.CREDIT,
        currency: wallet.currency,
        createdAt: new Date(),
        toWalletId: wallet.id,
        resultingBalance: updatedWallet.balance,
        counterpartyOwnerId: undefined,
        counterpartyOwnerType: undefined,
        metadata: { reason: 'credit' },
      };
      await this.transactionService.create(txDto, transactionSession);
      return updatedWallet;
    }, session);
  }

  async debitWallet(debitWalletDto: DebitWalletDto, session?: ClientSession): Promise<Wallet> {
    return runInTransaction(this.walletRepository, async (transactionSession) => {
      const wallet = await this.walletRepository.findByIdAndType(
        debitWalletDto.ownerId,
        debitWalletDto.ownerType,
        transactionSession,
      );
      if (!wallet) {
        throw new NotFoundException(`Wallet not found for owner ${debitWalletDto.ownerId}`);
      }
      if (wallet.balance < debitWalletDto.amount) {
        console.warn('Insufficient balance for debit', { ownerId: debitWalletDto.ownerId, amount: debitWalletDto.amount, balance: wallet.balance });
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
        trackId: uuidv4(),
        amount: debitWalletDto.amount,
        description: `Debit from wallet ${wallet.id}`,
        mobile: undefined,
        email: undefined,
        userId: debitWalletDto.ownerId,
        status: TransactionStatus.COMPLETED,
        type: TransactionType.DEBIT,
        currency: wallet.currency,
        createdAt: new Date(),
        fromWalletId: wallet.id,
        resultingBalance: updatedWallet.balance,
        metadata: { reason: 'debit' },
      };
      await this.transactionService.create(txDto, transactionSession);
      return updatedWallet;
    }, session);
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
        console.warn('Insufficient balance for transfer', { from: from.ownerId, amount, balance: fromWallet.balance });
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
        trackId: uuidv4(),
        amount,
        description: `Transfer from ${from.ownerId} to ${to.ownerId}`,
        mobile: undefined,
        email: undefined,
        userId: from.ownerId,
        status: TransactionStatus.COMPLETED,
        type: TransactionType.TRANSFER,
        currency: fromWallet.currency,
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

  // Block amount on a wallet (move from balance -> blockedBalance) and record a BLOCK transaction
  async blockAmount(
    owner: { ownerId: string; ownerType: WalletOwnerType },
    amount: number,
    meta: { orderId?: string; ticketId?: string; reason?: string } = {},
    session?: ClientSession,
  ): Promise<void> {
    const transactionSession = session || (await this.walletRepository.startTransaction());
    try {
      const wallet = await this.walletRepository.findByIdAndType(
        owner.ownerId,
        owner.ownerType,
        transactionSession,
      );
      if (!wallet) { throw new NotFoundException('Wallet not found'); }
      if (wallet.balance < amount) {
        console.warn('Insufficient balance to block', { ownerId: owner.ownerId, amount, balance: wallet.balance });
        throw new BadRequestException('Insufficient balance to block');
      }

      wallet.balance -= amount;
      wallet.blockedBalance = (wallet.blockedBalance ?? 0) + amount;

      await this.walletRepository.updateById(wallet.id, { balance: wallet.balance, blockedBalance: wallet.blockedBalance }, transactionSession);

      const txDto: CreateTransactionDto = {
        trackId: uuidv4(),
        amount,
        description: `Block ${amount} on wallet ${wallet.id}`,
        mobile: undefined,
        email: undefined,
        userId: owner.ownerId,
        status: TransactionStatus.COMPLETED,
        type: TransactionType.BLOCK,
        currency: wallet.currency,
        createdAt: new Date(),
        fromWalletId: wallet.id,
        resultingBalance: wallet.balance,
        metadata: { ...meta, reason: meta.reason ?? 'block' },
      };
      await this.transactionService.create(txDto, transactionSession);

      if (!session) { await this.walletRepository.commitTransaction(transactionSession); }
    } catch (error) {
      if (!session) { await this.walletRepository.abortTransaction(transactionSession); }
      throw new BadRequestException(`Failed to block amount: ${error.message}`);
    }
  }

  // Release blocked amount and either refund to user or transfer to another wallet
  async releaseBlockedAmount(
    from: { ownerId: string; ownerType: WalletOwnerType },
    to: { ownerId: string; ownerType: WalletOwnerType },
    amount: number,
    meta: { orderId?: string; ticketId?: string; reason?: string; type?: 'REFUND' | 'TRANSFER' },
    session?: ClientSession,
  ): Promise<void> {
    const transactionSession = session || (await this.walletRepository.startTransaction());
    try {
      const fromWallet = await this.walletRepository.findByIdAndType(from.ownerId, from.ownerType, transactionSession);
      const toWallet = await this.walletRepository.findByIdAndType(to.ownerId, to.ownerType, transactionSession);
      if (!fromWallet || !toWallet) { throw new NotFoundException('Wallet not found'); }
      if ((fromWallet.blockedBalance ?? 0) < amount) {
        console.warn('Insufficient blocked balance for release', { from: from.ownerId, amount, blockedBalance: fromWallet.blockedBalance });
        throw new BadRequestException('Insufficient blocked balance');
      }

      // If releasing from and to the same wallet, just reduce blockedBalance and avoid double-crediting
      const sameWallet = from.ownerId === to.ownerId && from.ownerType === to.ownerType;
      fromWallet.blockedBalance -= amount;
      if (!sameWallet) {
        toWallet.balance += amount;
      }

      await this.walletRepository.updateById(fromWallet.id, { blockedBalance: fromWallet.blockedBalance }, transactionSession);
      if (!sameWallet) {
        await this.walletRepository.updateById(toWallet.id, { balance: toWallet.balance }, transactionSession);
      }

      const txDto: CreateTransactionDto = {
        trackId: uuidv4(),
        amount,
        description: `${meta.type ?? 'TRANSFER'} from blocked on ${fromWallet.id} to ${toWallet.id}`,
        mobile: undefined,
        email: undefined,
        userId: from.ownerId,
        status: TransactionStatus.COMPLETED,
        type: meta.type === 'REFUND' ? TransactionType.REFUND : TransactionType.TRANSFER,
        currency: fromWallet.currency,
        createdAt: new Date(),
        fromWalletId: fromWallet.id,
        toWalletId: toWallet.id,
        resultingBalance: fromWallet.balance,
        resultingBalanceTo: toWallet.balance,
        metadata: { ...meta, reason: meta.reason ?? (meta.type ?? 'transfer') },
      };
      await this.transactionService.create(txDto, transactionSession);

      if (!session) { await this.walletRepository.commitTransaction(transactionSession); }
    } catch (error) {
      if (!session) { await this.walletRepository.abortTransaction(transactionSession); }
      throw new BadRequestException(`Failed to release blocked amount: ${error.message}`);
    }
  }

  async getWallet(getWalletDto: GetWalletDto, session?: ClientSession): Promise<Wallet> {
    const { ownerId, ownerType } = getWalletDto;

    if (!ownerType) {
      throw new BadRequestException('ownerType is required');
    }

    let wallet = await this.walletRepository.findByIdAndType(ownerId, ownerType, session);

    if (!wallet) {
      // Lazy creation: create wallet with initial values; ensure creation participates in provided session
      wallet = await this.walletRepository.createOne({
        ownerId,
        ownerType,
        balance: 0,
        currency: 'IRR',
      }, session);
    }

    return wallet;
  }
}
