import { TransactionStatus } from '../enums/transaction.status.enum';

export class CreateTransactionDto {
  authority: string;
  amount: number;
  description?: string;
  mobile?: string;
  email?: string;
  userId: string;
  status: TransactionStatus;
  createdAt?: Date;
  fromWalletId?: string;
  toWalletId?: string;
  counterpartyOwnerId?: string;
  counterpartyOwnerType?: string;
  resultingBalance?: number;
  resultingBalanceTo?: number;
  metadata?: Record<string, unknown>;
  correlationId?: string;
}
