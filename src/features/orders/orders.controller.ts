import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { IOrderService } from './interfaces/order.service.interface';
import { Order } from './entities/order.entity';
import { DeleteResult, UpdateResult } from 'mongoose';

@Controller('orders')
export class OrdersController implements IOrderService{
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<Order> {
    return this.ordersService.createOrder(createOrderDto);
  }

  @Get()
  async findAllOrders(): Promise<Order[]> {
    return this.ordersService.findAllOrders();
  }

  @Get(':id')
  async findOneOrder(@Param('id') id: string): Promise<Order> {
    return this.ordersService.findOneOrder(id);
  }

  @Patch(':id')
  async updateOrder(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto): Promise<UpdateResult> {
    return this.ordersService.updateOrder(id, updateOrderDto);
  }

  @Delete(':id')
  async removeOrder(@Param('id') id: string): Promise<DeleteResult> {
    return this.ordersService.removeOrder(id);
  }
}
