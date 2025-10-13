import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Model, ClientSession, Types } from 'mongoose';
import { Order } from '../entities/order.entity';
import {
  IBaseCrudRepository,
  IBaseTransactionRepository,
} from 'src/libs/repository/interfaces/base-repo.interfaces';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';
import { OrdersStatus } from '../enums/orders.status.enum';

export interface IOrderRepository extends IBaseCrudRepository<Order>, IBaseTransactionRepository<Order> {
  /**
   * Create a new order (with session)
   */
  create(order: Order, session?: ClientSession): Promise<Order>;
  findByUserId(userId: string, session?: ClientSession): Promise<Order[]>;
  findByCompanyId(companyId: string, session?: ClientSession): Promise<Order[]>;
  findActiveOrdersByUserId(userId: string, session?: ClientSession): Promise<Order[]>;
  findById(id: string, options?: { session?: ClientSession }): Promise<Order | null>;
  findManyByCondition(where: Record<string, unknown>, options?: { session?: ClientSession }): Promise<Order[]>;
  updateById(id: string, data: Partial<Order>, session?: ClientSession): Promise<Order>;
}

@Injectable()
export class OrderRepository extends BaseCrudRepository<Order> implements IOrderRepository {
  async create(order: Order, session?: ClientSession): Promise<Order> {
    return this.createOne(order, session);
  }

  async findById(id: string, options?: { session?: ClientSession }): Promise<Order | null> {
    return this.model.findById(id).session(options?.session ?? null).lean<Order>().exec();
  }

  async findManyByCondition(where: Record<string, unknown>, options?: { session?: ClientSession }): Promise<Order[]> {
    return this.model.find(where).session(options?.session ?? null).lean().exec();
  }

  async updateById(id: string, data: Partial<Order>, session?: ClientSession): Promise<Order> {
    const result = await this.model.findByIdAndUpdate(id, data, { new: true }).session(session ?? null).lean().exec();
    if (!result) throw new NotFoundException(`Order with ID '${id}' not found`);
    return result as Order;
  }
  constructor(
    orderModel: Model<Order>,
    private readonly transactionRepository: IBaseTransactionRepository<Order>,
  ) {
    super(orderModel);
  }
  async findByUserId(userId: string, session?: ClientSession): Promise<Order[]> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException(`Invalid user ID format: ${userId}`);
      }
      const orders = this.findManyByCondition({ userId }, { session });
      if (!orders) {
        throw new NotFoundException(`user with id: ${userId} not found`);
      }
      return await orders;
    } catch (error) {
      throw new BadRequestException(
        `Failed to find orders by userId: ${userId}. Error: ${error.message}`,
      );
    }
  }

  async findByCompanyId(companyId: string, session?: ClientSession): Promise<Order[]> {
    try {
      if (!Types.ObjectId.isValid(companyId)) {
        throw new BadRequestException(`Invalid company ID format: ${companyId}`);
      }
      const orders = this.findManyByCondition({ companyId }, { session });

      return await orders;
    } catch (error) {
      throw new BadRequestException(
        `Failed to find orders for company ID '${companyId}': ${error.message}`,
      );
    }
  }

  async findActiveOrdersByUserId(userId: string, session?: ClientSession): Promise<Order[]> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException(`Invalid user ID format: ${userId}`);
      }
      const activeStatuses = [
        OrdersStatus.PENDING,
        OrdersStatus.PAID,
        OrdersStatus.COMPLETED,
        OrdersStatus.SHIPPED,
      ];
      const activeOrders = this.findManyByCondition(
        { userId, status: { $in: activeStatuses } },
        { session },
      );
      return await activeOrders;
    } catch (error) {
      throw new BadRequestException(
        `Failed to find active orders for user ID '${userId}': ${error.message}`,
      );
    }
  }

  async startTransaction(): Promise<ClientSession> {
    const session = await this.transactionRepository.startTransaction();
    return session;
  }

  async commitTransaction(session: ClientSession): Promise<void> {
    await this.transactionRepository.commitTransaction(session);
  }

  async abortTransaction(session: ClientSession): Promise<void> {
    await this.transactionRepository.abortTransaction(session);
  }
}
