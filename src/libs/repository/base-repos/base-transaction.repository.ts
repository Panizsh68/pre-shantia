import { Model, Document, ClientSession } from 'mongoose';
import { BadRequestException } from '@nestjs/common';
import { IBaseTransactionRepository } from '../interfaces/base-repo.interfaces';

/**
 * Repository for transaction management.
 */
export class BaseTransactionRepository<T extends Document>
  implements IBaseTransactionRepository<T>
{
  constructor(protected readonly model: Model<T>) {
    if (!model) {
      throw new Error('Model instance is required');
    }
  }

  /**
   * Starts a transaction.
   * @returns The transaction session.
   */
  async startTransaction(): Promise<ClientSession> {
    try {
      const session = await this.model.db.startSession();
      session.startTransaction();
      return session;
    } catch (error) {
      throw new BadRequestException(`Failed to start transaction: ${(error as Error).message}`);
    }
  }

  /**
   * Commits a transaction.
   * @param session - The transaction session.
   */
  async commitTransaction(session: ClientSession): Promise<void> {
    try {
      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      throw new BadRequestException(`Failed to commit transaction: ${(error as Error).message}`);
    }
  }

  /**
   * Aborts a transaction.
   * @param session - The transaction session.
   */
  async abortTransaction(session: ClientSession): Promise<void> {
    try {
      await session.abortTransaction();
      session.endSession();
    } catch (error) {
      throw new BadRequestException(`Failed to abort transaction: ${(error as Error).message}`);
    }
  }
}
