import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IWalletRepository } from './repositories/wallet.repository';
import { CreditWalletDto } from './dto/credit-wallet.dto';
import { GetWalletDto } from './dto/get-wallet.dto';

@Injectable()
export class WalletsService {
  constructor(@Inject('WalletRepository') private readonly walletRepository: IWalletRepository) {}

  async creditWallet(creditWalletDto: CreditWalletDto) {
    const wallet = await this.walletRepository.findOne((creditWalletDto.ownerId).toString())
    if (!wallet) throw new NotFoundException
    wallet.balance += creditWalletDto.amount
    return this.walletRepository.update((wallet._id).toString(), { balance: wallet.balance });
  }

  async getWallet(getWalletDto: GetWalletDto) {
    const wallet = await this.walletRepository.findOne((getWalletDto.ownerId).toString())
    if (!wallet) throw new NotFoundException
    return wallet
  }
}
