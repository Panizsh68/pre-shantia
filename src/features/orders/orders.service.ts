import { Inject, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { IOrderService } from './interfaces/order.service.interface';
import { Order } from './entities/order.entity';
import { OrderRepository } from './repositories/order.repository';
import { QueryOptionsDto } from 'src/utils/query-options.dto';

@Injectable()
export class OrdersService implements IOrderService {
  constructor(@Inject('OrderRepository') private readonly orderRepository: OrderRepository) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const order = await this.orderRepository.create(createOrderDto)
    return order
  }

  async findAll(options: QueryOptionsDto): Promise<Order[]> {
    const orders = await this.orderRepository.findAll(options)
    return orders
  }

  async findOne(id: string): Promise<Order | null> {
    const order = await this.orderRepository.findOne(id)
    return order
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order | null> {
    const updatedOrder = await this.orderRepository.update(id, updateOrderDto)
    return updatedOrder
  }

  async remove(id: string): Promise<boolean> {
    const removedOrder = await this.orderRepository.delete(id)
    return removedOrder
  }
}
