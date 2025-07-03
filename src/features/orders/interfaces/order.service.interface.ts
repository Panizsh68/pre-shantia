import { ClientSession } from 'mongoose';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { IOrder } from './order.interface';
import { Order } from '../entities/order.entity';

export interface IOrdersService {
  create(dto: CreateOrderDto, session?: ClientSession): Promise<IOrder[]>;
  find(filter: { where: Record<string, unknown> }, session?: ClientSession): Promise<Order[]>;
  findById(id: string, session?: ClientSession): Promise<Order>;
  findByUserId(userId: string): Promise<Order[]>;
  findByCompanyId(companyId: string): Promise<Order[]>;
  findActiveOrdersByUserId(userId: string): Promise<Order[]>;
  update(dto: UpdateOrderDto, session?: ClientSession): Promise<Order>;
  cancel(id: string, session?: ClientSession): Promise<Order>;
  markAsPaid(id: string, session?: ClientSession): Promise<Order>;
  markAsShipped(id: string, transportId?: string, session?: ClientSession): Promise<Order>;
  markAsDelivered(id: string, session?: ClientSession): Promise<Order>;
  refund(id: string, session?: ClientSession): Promise<IOrder>;
  confirmDelivery(orderId: string, userId: string, session?: ClientSession): Promise<IOrder>;
}
