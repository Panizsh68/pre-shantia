import {
  IBaseCrudRepository,
  IBaseTransactionRepository,
} from 'src/libs/repository/interfaces/base-repo.interfaces';
import { Transporting } from '../entities/transporting.entity';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';
import { ClientSession, Model } from 'mongoose';

export interface ITransportingRepository
  extends IBaseCrudRepository<Transporting>,
    IBaseTransactionRepository<Transporting> {
  findByOrderId(orderId: string): Promise<Transporting>;
  findByCompanyId(companyId: string): Promise<Transporting[]>;
}

@Injectable()
export class TransportingRepository
  extends BaseCrudRepository<Transporting>
  implements ITransportingRepository
{
  constructor(
    transportingModel: Model<Transporting>,
    private readonly baseTransactionRepo: IBaseTransactionRepository<Transporting>,
  ) {
    super(transportingModel);
  }
  async findByOrderId(orderId: string): Promise<Transporting> {
    try {
      const transporting = await this.findOneByCondition({ orderId });
      if (!transporting) {
        throw new NotFoundException(`Transporting with orderId: ${orderId} not found`);
      }
      return transporting;
    } catch (error) {
      throw new BadRequestException(
        `Failed to find transporting by orderId: ${orderId}. Error: ${(error as Error).message}`,
      );
    }
  }

  async findByCompanyId(companyId: string): Promise<Transporting[]> {
    try {
      const transportings = await this.findManyByCondition({ companyId });
      if (!transportings || transportings.length === 0) {
        throw new NotFoundException(`No transportings found for companyId: ${companyId}`);
      }
      return transportings;
    } catch (error) {
      throw new BadRequestException(
        `Failed to find transportings by companyId: ${companyId}. Error: ${(error as Error).message}`,
      );
    }
  }

  async startTransaction(): Promise<ClientSession> {
    return this.baseTransactionRepo.startTransaction();
  }

  async commitTransaction(session: ClientSession): Promise<void> {
    return this.baseTransactionRepo.commitTransaction(session);
  }

  async abortTransaction(session: ClientSession): Promise<void> {
    return this.baseTransactionRepo.abortTransaction(session);
  }
}
