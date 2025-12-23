import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientSession } from 'mongoose';
import { Transaction } from './schema/transaction.schema';
import { CreateTransactionDto } from './dtos/create-transaction.dto';
import { ITransactionRepository } from './repositories/transaction.repository';
import { ITransactionService } from './interfaces/transaction.service.interface';

@Injectable()
export class TransactionService implements ITransactionService {
  constructor(
    @Inject('TransactionRepository') private readonly transactionRepository: ITransactionRepository,
  ) { }

  async create(
    createTransactionDto: CreateTransactionDto,
    session?: ClientSession,
  ): Promise<Transaction> {
    // normalize nullable trackId to undefined to satisfy schema typing
    const normalized = { ...createTransactionDto } as any;
    if (normalized.trackId === null) { normalized.trackId = undefined; }
    const transaction = await this.transactionRepository.createOne(normalized, session);
    return transaction;
  }

  async findOne(trackId: string, session?: ClientSession): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOneByCondition(
      { trackId },
      { session },
    );
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

  async update(
    trackId: string,
    updateData: Partial<CreateTransactionDto>,
    session?: ClientSession,
  ): Promise<Transaction> {
    const transaction = await this.transactionRepository.updateOneByCondition(
      { trackId },
      { $set: updateData },
      { new: true, session },
    );
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

  async updateByLocalId(
    localId: string,
    updateData: Partial<CreateTransactionDto>,
    session?: ClientSession,
  ): Promise<Transaction> {
    const transaction = await this.transactionRepository.updateOneByCondition(
      { localId },
      { $set: updateData },
      { new: true, session },
    );
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

  /**
   * Atomically update a transaction only if it is in expectedStatus (e.g., PENDING).
   * This helps prevent race conditions where two callbacks try to finalize the same transaction.
   */
  async updateIfStatus(
    trackId: string,
    expectedStatus: string | number | Array<string | number>,
    updateData: Partial<CreateTransactionDto>,
    session?: ClientSession,
    options?: { allowFallback?: boolean },
  ): Promise<Transaction | null> {
    // Prefer the repository's atomic helper when available to avoid races.
    // If not present, fall back to a conditional update.
    const repo = this.transactionRepository as ITransactionRepository;
    // Require repository atomic helper by default to avoid race conditions in multi-instance setups.
    if (!repo.findOneByTrackIdAndStatusAndUpdate) {
      if (!options?.allowFallback) {
        throw new Error('Repository does not implement atomic findOneByTrackIdAndStatusAndUpdate; aborting to avoid race conditions');
      }
    }

    if (repo.findOneByTrackIdAndStatusAndUpdate) {
      const tx = await repo.findOneByTrackIdAndStatusAndUpdate(
        trackId,
        expectedStatus,
        { $set: updateData },
        session,
      );
      return tx;
    }

    // Fallback (only when explicitly allowed): build a condition. If expectedStatus is an array, use $in.
    const statusCondition = Array.isArray(expectedStatus)
      ? { $in: expectedStatus }
      : expectedStatus;

    const tx = await this.transactionRepository.updateOneByCondition(
      { trackId, status: statusCondition } as any,
      { $set: updateData },
      { new: true, session },
    );
    return tx ?? null;
  }

  async startSession(): Promise<ClientSession> {
    const session = await this.transactionRepository.startTransaction();
    return session;
  }

  async commitSession(session: ClientSession): Promise<void> {
    await this.transactionRepository.commitTransaction(session);
  }
  async abortSession(session: ClientSession): Promise<void> {
    await this.transactionRepository.abortTransaction(session);
  }

  async findAll() {
    return this.transactionRepository.findManyByCondition({});
  }

  async findAllByProfile(userId: string) {
    return this.transactionRepository
      .findManyByCondition({ userId })
  }
}
