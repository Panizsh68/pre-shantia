import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { IOrderService } from './interfaces/order.service.interface';
import { Order } from './entities/order.entity';
import { DeleteResult, UpdateResult } from 'mongoose';
import { QueryOptionsDto } from 'src/utils/query-options.dto';

@Controller('orders')
export class OrdersController implements IOrderService{
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto): Promise<Order> {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  async findAll(options: QueryOptionsDto): Promise<Order[]> {
    return this.ordersService.findAll(options);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Order | null> {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto): Promise<Order | null> {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<boolean> {
    return this.ordersService.remove(id);
  }
}
