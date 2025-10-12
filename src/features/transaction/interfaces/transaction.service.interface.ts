import { ClientSession } from 'mongoose';
import { CreateTransactionDto } from '../dtos/create-transaction.dto';
import { Transaction } from '../schema/transaction.schema';

export interface ITransactionService {
  create(createTransactionDto: CreateTransactionDto, session?: ClientSession): Promise<Transaction>;
  findOne(trackId: string, session?: ClientSession): Promise<Transaction>;
  update(
    trackId: string,
    updateData: Partial<CreateTransactionDto>,
    session?: ClientSession,
  ): Promise<Transaction>;
  startSession(): Promise<ClientSession>;
  commitSession(session: ClientSession): Promise<void>;
  abortSession(session: ClientSession): Promise<void>;
  updateIfStatus?(trackId: string, expectedStatus: string | number, updateData: Partial<CreateTransactionDto>, session?: ClientSession): Promise<Transaction | null>;
  updateByLocalId?(localId: string, updateData: Partial<CreateTransactionDto>, session?: ClientSession): Promise<Transaction>;
}
