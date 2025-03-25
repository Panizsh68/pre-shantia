import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { IOrderService } from './interfaces/order.service.interface';
import { Order } from './entities/order.entity';
import { DeleteResult, Model, UpdateResult } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class OrdersService implements IOrderService{
  constructor(@InjectModel(Order.name) private readonly orderModel: Model<Order>) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const order = await this.orderModel.create(createOrderDto)
    return await order.save()
  }

  async findAllOrders(): Promise<Order[]> {
    const orders = await this.orderModel.find()
    return orders
  }

  async findOneOrder(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id)
    if (!order) throw new NotFoundException('order not found')
    return order
  }

  async updateOrder(id: string, updateOrderDto: UpdateOrderDto): Promise<UpdateResult> {
    const updatedOrder = await this.orderModel.updateOne({ _id: id}, updateOrderDto)
    return updatedOrder
  }

  async removeOrder(id: string): Promise<DeleteResult> {
    const removedOrder = await this.orderModel.deleteOne({ _id: id })
    return removedOrder
  }
}
