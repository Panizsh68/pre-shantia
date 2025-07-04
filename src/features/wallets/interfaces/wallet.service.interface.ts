import { ClientSession } from 'mongoose';
import { CreditWalletDto } from '../dto/credit-wallet.dto';
import { WalletOwnerType } from '../enums/wallet-ownertype.enum';
import { DebitWalletDto } from '../dto/debit-wallet.dto';
import { GetWalletDto } from '../dto/get-wallet.dto';

export interface IWalletService {
  creditWallet(creditWalletDto: CreditWalletDto, session?: ClientSession);
  debitWallet(debitWalletDto: DebitWalletDto, session?: ClientSession);
  transfer(
    from: { ownerId: string; ownerType: WalletOwnerType },
    to: { ownerId: string; ownerType: WalletOwnerType },
    amount: number,
    session?: ClientSession,
  );
  getWallet(getWalletDto: GetWalletDto, session?: ClientSession);
}
