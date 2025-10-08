import { TransactionStatus } from '../enums/transaction.status.enum';
import { TransactionType } from '../enums/transaction.type.enum';

export class CreateTransactionDto {
  authority: string;
  amount: number;
  description?: string;
  mobile?: string;
  email?: string;
  userId: string;
  status: TransactionStatus;
  type?: TransactionType;
  currency?: string;
  createdAt?: Date;
  fromWalletId?: string;
  toWalletId?: string;
  counterpartyOwnerId?: string;
  counterpartyOwnerType?: string;
  resultingBalance?: number;
  resultingBalanceTo?: number;
  orderId?: string;
  ticketId?: string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
}
