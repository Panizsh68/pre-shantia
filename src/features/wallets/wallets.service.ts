import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreditWalletDto } from './dto/credit-wallet.dto';
import { IWalletService } from './interfaces/wallet.service.interface';
import { IWalletRepository } from './repositories/wallet.repository';
import { DebitWalletDto } from './dto/debit-wallet.dto';
import { WalletOwnerType } from './enums/wallet-ownertype.enum';
import { GetWalletDto } from './dto/get-wallet.dto';
import { ClientSession } from 'mongoose';
import { Wallet } from './entities/wallet.entity';

@Injectable()
export class WalletsService implements IWalletService {
  async createWallet(data: { ownerId: string; ownerType: string; balance?: number; currency?: string }): Promise<Wallet> {
    return await this.walletRepository.createOne({
      ownerId: data.ownerId,
      ownerType: data.ownerType,
      balance: data.balance ?? 0,
      currency: data.currency ?? 'IRR',
    });
  }
  constructor(@Inject('WalletRepository') private readonly walletRepository: IWalletRepository) { }

  async creditWallet(creditWalletDto: CreditWalletDto, session?: ClientSession): Promise<Wallet> {
    const transactionSession = session || (await this.walletRepository.startTransaction());
    try {
      const wallet = await this.walletRepository.findByIdAndType(
        creditWalletDto.ownerId,
        creditWalletDto.ownerType,
        session,
      );
      if (!wallet) {
        throw new NotFoundException(`Wallet not found for owner ${creditWalletDto.ownerId}`);
      }

      wallet.balance += creditWalletDto.amount;
      const updatedWallet = await this.walletRepository.updateById(
        wallet.id,
        { balance: wallet.balance },
        session,
      );
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
        session,
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
        session,
      );
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
        session,
      );
      const toWallet = await this.walletRepository.findByIdAndType(
        to.ownerId,
        to.ownerType,
        session,
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
        session,
      );
      await this.walletRepository.updateById(toWallet.id, { balance: toWallet.balance }, session);

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
