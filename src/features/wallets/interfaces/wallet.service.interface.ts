import { ClientSession } from 'mongoose';
import { CreditWalletDto } from '../dto/credit-wallet.dto';
import { WalletOwnerType } from '../enums/wallet-ownertype.enum';
import { DebitWalletDto } from '../dto/debit-wallet.dto';
import { GetWalletDto } from '../dto/get-wallet.dto';
import { Wallet } from '../entities/wallet.entity';

export interface IWalletService {
  createWallet(data: { ownerId: string; ownerType: string; balance?: number; currency?: string }, session?: ClientSession): Promise<Wallet>;
  creditWallet(creditWalletDto: CreditWalletDto, session?: ClientSession);
  debitWallet(debitWalletDto: DebitWalletDto, session?: ClientSession);
  transfer(
    from: { ownerId: string; ownerType: WalletOwnerType },
    to: { ownerId: string; ownerType: WalletOwnerType },
    amount: number,
    session?: ClientSession,
  );
  blockAmount(
    owner: { ownerId: string; ownerType: WalletOwnerType },
    amount: number,
    meta?: { orderId?: string; ticketId?: string; reason?: string },
    session?: ClientSession,
  );
  releaseBlockedAmount(
    from: { ownerId: string; ownerType: WalletOwnerType },
    to: { ownerId: string; ownerType: WalletOwnerType },
    amount: number,
    meta?: { orderId?: string; ticketId?: string; reason?: string; type?: 'REFUND' | 'TRANSFER' },
    session?: ClientSession,
  );
  getWallet(getWalletDto: GetWalletDto, session?: ClientSession);
}
