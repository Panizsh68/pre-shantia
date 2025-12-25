import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ITransportingRepository } from './repositories/transporting.repository';
import { ITransportingsService } from './interfaces/transporting.service.interface';
import { ITransporting } from './interfaces/transporting.interface';
import { TransportingStatus } from './enums/transporting.status.enum';
import { Types } from 'mongoose';
import { CreateTransportingDto } from './dto/create-transporting.dto';
import { UpdateTransportingDto } from './dto/update-transporting.dto';
import { runInTransaction } from 'src/libs/repository/run-in-transaction';
import { IOrdersService } from '../orders/interfaces/order.service.interface';

@Injectable()
export class TransportingsService implements ITransportingsService {
  constructor(
    @Inject('TransportingRepository')
    private readonly transportingRepository: ITransportingRepository,
    @Inject('IOrdersService') private readonly ordersService: IOrdersService,
  ) { }

  async create(dto: CreateTransportingDto): Promise<ITransporting> {
    return runInTransaction(this.transportingRepository, async (session) => {
      const transportingData = {
        ...dto,
        orderId: dto.orderId,
        companyId: dto.companyId,
        status: dto.status || TransportingStatus.PENDING,
        estimateDelivery: dto.estimatedDelivery ? new Date(dto.estimatedDelivery) : undefined,
      };

      const newTransporting = await this.transportingRepository.createOne(transportingData, session);
      return newTransporting;
    }).catch(error => {
      throw new BadRequestException(`Failed to create transporting. Error: ${(error as Error).message}`);
    });
  }

  async findById(id: string): Promise<ITransporting> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transporting ID format');
    }
    const transporting = await this.transportingRepository.findById(id);
    if (!transporting) {
      throw new NotFoundException(`Transporting with id: ${id} not found`);
    }
    return transporting;
  }

  async findByOrderId(orderId: string): Promise<ITransporting> {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException(`Invalid order ID format: ${orderId}`);
    }
    const transporting = await this.transportingRepository.findByOrderId(orderId);
    return transporting;
  }

  async findByCompanyId(companyId: string): Promise<ITransporting[]> {
    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException(`Invalid company ID format: ${companyId}`);
    }
    const transportings = await this.transportingRepository.findByCompanyId(companyId);
    return transportings;
  }

  async update(dto: UpdateTransportingDto): Promise<ITransporting> {
    if (!Types.ObjectId.isValid(dto.id)) {
      throw new BadRequestException('Invalid transporting ID format');
    }

    return runInTransaction(this.transportingRepository, async (session) => {
      const updateData = {
        carrier: dto.carrier,
        trackingNumber: dto.trackingNumber,
        status: dto.status,
        estimateDelivery: dto.estimatedDelivery ? new Date(dto.estimatedDelivery) : undefined,
      };
      const updatedTransporting = await this.transportingRepository.updateById(dto.id, updateData, session);
      if (!updatedTransporting) {
        throw new NotFoundException(`Transporting with id: ${dto.id} not found`);
      }
      return updatedTransporting;
    }).catch(error => {
      throw new BadRequestException(`Failed to update transporting. Error: ${(error as Error).message}`);
    });
  }

  async cancel(id: string): Promise<ITransporting> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transporting ID format');
    }
    return runInTransaction(this.transportingRepository, async (session) => {
      const transporting = await this.transportingRepository.findById(id, { session });
      if (!transporting) {
        throw new NotFoundException(`Transporting with id: ${id} not found`);
      }
      if (transporting.status === TransportingStatus.CANCELED) {
        throw new BadRequestException(`Transporting record with ID '${id}' is already canceled`);
      }
      if (transporting.status === TransportingStatus.DELIVERED) {
        throw new BadRequestException(
          `Cannot cancel delivered transporting record with ID '${id}'`,
        );
      }
      transporting.status = TransportingStatus.CANCELED;
      const updatedTransporting = await this.transportingRepository.saveOne(transporting, session);
      return updatedTransporting;
    }).catch(error => {
      throw new BadRequestException(`Failed to cancel transporting. Error: ${(error as Error).message}`);
    });
  }

  async markAsDelivered(id: string, estimatedDelivery?: Date): Promise<ITransporting> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transporting ID format');
    }
    return runInTransaction(this.transportingRepository, async (session) => {
      const transporting = await this.transportingRepository.findById(id, { session });
      if (!transporting) {
        throw new NotFoundException(`Transporting with id: ${id} not found`);
      }
      if (transporting.status === TransportingStatus.DELIVERED) {
        throw new BadRequestException(`Transporting record with ID '${id}' is already delivered`);
      }
      if (transporting.status === TransportingStatus.CANCELED) {
        throw new BadRequestException(
          `Cannot mark canceled transporting record with ID '${id}' as delivered`,
        );
      }
      transporting.status = TransportingStatus.DELIVERED;
      if (estimatedDelivery) {
        transporting.estimatedDelivery = new Date(estimatedDelivery);
      }
      const updatedTransporting = await this.transportingRepository.saveOne(transporting, session);
      await this.ordersService.markAsDelivered(transporting.orderId, session);
      return updatedTransporting;
    }).catch(error => {
      throw new BadRequestException(`Failed to mark transporting as delivered. Error: ${(error as Error).message}`);
    });
  }
}
