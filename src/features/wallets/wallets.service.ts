import { BadRequestException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
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
import { IUsersService } from '../users/interfaces/user.service.interface';
import { ICompanyService } from '../companies/interfaces/company.service.interface';
import { getIntermediaryWalletId } from 'src/utils/intermediary-wallet.util';

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
    @Inject(forwardRef(() => 'IUsersService')) private readonly usersService: IUsersService,
    @Inject(forwardRef(() => 'ICompanyService')) private readonly companiesService: ICompanyService,
  ) { }

  private async validateOwner(ownerId: string, ownerType: WalletOwnerType): Promise<void> {
    // Intermediary is the platform itself, identified by a special ID
    if (ownerType === WalletOwnerType.INTERMEDIARY) {
      const intermediaryId = getIntermediaryWalletId();
      if (ownerId !== intermediaryId) {
        throw new BadRequestException(`Invalid intermediary owner ID: ${ownerId}`);
      }
      return;
    }

    if (ownerType === WalletOwnerType.USER) {
      try {
        const user = await this.usersService.findOne(ownerId);
        if (!user) {
          throw new BadRequestException(`Destination user ${ownerId} not found`);
        }
      } catch (err) {
        throw new BadRequestException(`Destination user ${ownerId} not found or inactive`);
      }
    } else if (ownerType === WalletOwnerType.COMPANY) {
      try {
        const company = await this.companiesService.findOne(ownerId);
        if (!company) {
          throw new BadRequestException(`Destination company ${ownerId} not found`);
        }
        // B2B Security: Ensure the company is active before allowing any fund transfer/release
        if (company.status !== 'active') {
          throw new BadRequestException(`Destination company ${ownerId} is not active (current status: ${company.status})`);
        }
      } catch (err) {
        if (err instanceof BadRequestException) throw err;
        throw new BadRequestException(`Destination company ${ownerId} not found or inactive`);
      }
    }
  }

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

      const updatedWallet = await this.walletRepository.updateById(
        wallet.id,
        { $inc: { balance: creditWalletDto.amount } } as any,
        transactionSession,
      );

      const txDto: CreateTransactionDto = {
        trackId: uuidv4(),
        amount: creditWalletDto.amount,
        description: `Credit to wallet ${wallet.id}`,
        userId: creditWalletDto.ownerId,
        status: TransactionStatus.COMPLETED,
        type: TransactionType.CREDIT,
        currency: wallet.currency,
        createdAt: new Date(),
        toWalletId: wallet.id,
        resultingBalance: updatedWallet.balance,
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

      const updatedWallet = await this.walletRepository.updateOneByCondition(
        { _id: wallet.id, balance: { $gte: debitWalletDto.amount } } as any,
        { $inc: { balance: -debitWalletDto.amount } } as any,
        { session: transactionSession }
      ).catch(() => null);

      if (!updatedWallet) {
        throw new BadRequestException('Insufficient balance');
      }

      const txDto: CreateTransactionDto = {
        trackId: uuidv4(),
        amount: debitWalletDto.amount,
        description: `Debit from wallet ${wallet.id}`,
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
    correlationId?: string,
  ): Promise<void> {
    // L2 Fix: Validate destination owner existence and status before transferring funds
    await this.validateOwner(to.ownerId, to.ownerType);

    const transactionSession = session || (await this.walletRepository.startTransaction());
    try {
      if (correlationId) {
        const alreadyDone = await this.transactionService.existsByCorrelationId(correlationId, transactionSession);
        if (alreadyDone) {
          if (!session) await this.walletRepository.commitTransaction(transactionSession);
          return;
        }
      }

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

      const updatedFromWallet = await this.walletRepository.updateOneByCondition(
        { _id: fromWallet.id, balance: { $gte: amount } } as any,
        { $inc: { balance: -amount } } as any,
        { session: transactionSession }
      ).catch(() => null);

      if (!updatedFromWallet) {
        throw new BadRequestException('Insufficient balance for transfer');
      }

      const updatedToWallet = await this.walletRepository.updateById(
        toWallet.id,
        { $inc: { balance: amount } } as any,
        transactionSession,
      );

      const txDto: CreateTransactionDto = {
        trackId: uuidv4(),
        amount,
        description: `Transfer from ${from.ownerId} to ${to.ownerId}`,
        userId: from.ownerId,
        status: TransactionStatus.COMPLETED,
        type: TransactionType.TRANSFER,
        currency: fromWallet.currency,
        createdAt: new Date(),
        fromWalletId: fromWallet.id,
        toWalletId: toWallet.id,
        resultingBalance: updatedFromWallet.balance,
        resultingBalanceTo: updatedToWallet.balance,
        counterpartyOwnerId: to.ownerId,
        counterpartyOwnerType: to.ownerType,
        metadata: { reason: 'transfer' },
        correlationId
      };
      await this.transactionService.create(txDto, transactionSession);

      if (!session) {
        await this.walletRepository.commitTransaction(transactionSession);
      }
    } catch (error) {
      if (!session) {
        await this.walletRepository.abortTransaction(transactionSession);
      }
      throw error instanceof BadRequestException || error instanceof NotFoundException 
        ? error 
        : new BadRequestException(`Transfer failed: ${error.message}`);
    }
  }

  async blockAmount(
    owner: { ownerId: string; ownerType: WalletOwnerType },
    amount: number,
    meta: { orderId?: string; ticketId?: string; reason?: string; correlationId?: string } = {},
    session?: ClientSession,
  ): Promise<void> {
    const transactionSession = session || (await this.walletRepository.startTransaction());
    try {
      if (meta.correlationId) {
        const alreadyDone = await this.transactionService.existsByCorrelationId(meta.correlationId, transactionSession);
        if (alreadyDone) {
          if (!session) await this.walletRepository.commitTransaction(transactionSession);
          return;
        }
      }

      const wallet = await this.walletRepository.findByIdAndType(
        owner.ownerId,
        owner.ownerType,
        transactionSession,
      );
      if (!wallet) { throw new NotFoundException('Wallet not found'); }

      const updatedWallet = await this.walletRepository.updateOneByCondition(
        { _id: wallet.id, balance: { $gte: amount } } as any,
        { $inc: { balance: -amount, blockedBalance: amount } } as any,
        { session: transactionSession }
      ).catch(() => null);

      if (!updatedWallet) {
        throw new BadRequestException('Insufficient balance to block');
      }

      const txDto: CreateTransactionDto = {
        trackId: uuidv4(),
        amount,
        description: `Block ${amount} on wallet ${wallet.id}`,
        userId: owner.ownerId,
        status: TransactionStatus.COMPLETED,
        type: TransactionType.BLOCK,
        currency: wallet.currency,
        createdAt: new Date(),
        fromWalletId: wallet.id,
        resultingBalance: updatedWallet.balance,
        metadata: { ...meta, reason: meta.reason ?? 'block' },
        correlationId: meta.correlationId
      };
      await this.transactionService.create(txDto, transactionSession);

      if (!session) { await this.walletRepository.commitTransaction(transactionSession); }
    } catch (error) {
      if (!session) { await this.walletRepository.abortTransaction(transactionSession); }
      throw error instanceof BadRequestException || error instanceof NotFoundException 
        ? error 
        : new BadRequestException(`Failed to block amount: ${error.message}`);
    }
  }

  async releaseBlockedAmount(
    from: { ownerId: string; ownerType: WalletOwnerType },
    to: { ownerId: string; ownerType: WalletOwnerType },
    amount: number,
    meta: { orderId?: string; ticketId?: string; reason?: string; type?: 'REFUND' | 'TRANSFER'; correlationId?: string } = {},
    session?: ClientSession,
  ): Promise<void> {
    // L2 Fix: Validate destination owner existence and status before releasing blocked funds
    await this.validateOwner(to.ownerId, to.ownerType);

    const transactionSession = session || (await this.walletRepository.startTransaction());
    try {
      if (meta.correlationId) {
        const alreadyDone = await this.transactionService.existsByCorrelationId(meta.correlationId, transactionSession);
        if (alreadyDone) {
          if (!session) await this.walletRepository.commitTransaction(transactionSession);
          return;
        }
      }

      const fromWallet = await this.walletRepository.findByIdAndType(from.ownerId, from.ownerType, transactionSession);
      const toWallet = await this.walletRepository.findByIdAndType(to.ownerId, to.ownerType, transactionSession);
      if (!fromWallet || !toWallet) { throw new NotFoundException('Wallet not found'); }

      const updatedFromWallet = await this.walletRepository.updateOneByCondition(
        { _id: fromWallet.id, blockedBalance: { $gte: amount } } as any,
        { $inc: { blockedBalance: -amount } } as any,
        { session: transactionSession }
      ).catch(() => null);

      if (!updatedFromWallet) {
        throw new BadRequestException('Insufficient blocked balance');
      }

      let resultingBalanceTo = toWallet.balance;
      const sameWallet = from.ownerId === to.ownerId && from.ownerType === to.ownerType;
      if (!sameWallet) {
        const updatedToWallet = await this.walletRepository.updateById(toWallet.id, { $inc: { balance: amount } } as any, transactionSession);
        resultingBalanceTo = updatedToWallet.balance;
      }

      const txDto: CreateTransactionDto = {
        trackId: uuidv4(),
        amount,
        description: `${meta.type ?? 'TRANSFER'} from blocked on ${fromWallet.id} to ${toWallet.id}`,
        userId: from.ownerId,
        status: TransactionStatus.COMPLETED,
        type: meta.type === 'REFUND' ? TransactionType.REFUND : TransactionType.TRANSFER,
        currency: fromWallet.currency,
        createdAt: new Date(),
        fromWalletId: fromWallet.id,
        toWalletId: toWallet.id,
        resultingBalance: updatedFromWallet.balance,
        resultingBalanceTo,
        metadata: { ...meta, reason: meta.reason ?? (meta.type ?? 'transfer') },
        correlationId: meta.correlationId
      };
      await this.transactionService.create(txDto, transactionSession);

      if (!session) { await this.walletRepository.commitTransaction(transactionSession); }
    } catch (error) {
      if (!session) { await this.walletRepository.abortTransaction(transactionSession); }
      throw error instanceof BadRequestException || error instanceof NotFoundException 
        ? error 
        : new BadRequestException(`Failed to release blocked amount: ${error.message}`);
    }
  }

  async getWallet(getWalletDto: GetWalletDto, session?: ClientSession): Promise<Wallet> {
    const { ownerId, ownerType } = getWalletDto;

    if (!ownerType) {
      throw new BadRequestException('ownerType is required');
    }

    let wallet = await this.walletRepository.findByIdAndType(ownerId, ownerType, session);

    if (!wallet) {
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
