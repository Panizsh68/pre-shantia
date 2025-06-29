import { ClientSession } from 'mongoose';
import { CreateTransactionDto } from '../dtos/create-transaction.dto';
import { Transaction } from '../schema/transaction.schema';

export interface ITransactionService {
  create(createTransactionDto: CreateTransactionDto, session?: ClientSession): Promise<Transaction>;
  findOne(authority: string, session?: ClientSession): Promise<Transaction>;
  update(
    authority: string,
    updateData: Partial<CreateTransactionDto>,
    session?: ClientSession,
  ): Promise<Transaction>;
  startSession(): Promise<ClientSession>;
  commitSession(session: ClientSession): Promise<void>;
  abortSession(session: ClientSession): Promise<void>;
}
