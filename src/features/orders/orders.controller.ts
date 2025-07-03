import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { IOrdersService } from './interfaces/order.service.interface';

@Controller('orders')
export class OrdersController {
  constructor(@Inject('IOrdersService') private readonly ordersService: IOrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateOrderDto) {
    return await this.ordersService.create(dto);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.ordersService.findById(id);
  }

  @Get()
  async find(@Query('userId') userId?: string, @Query('companyId') companyId?: string) {
    if (userId) {
      return await this.ordersService.findByUserId(userId);
    }
    if (companyId) {
      return await this.ordersService.findByCompanyId(companyId);
    }
    return [];
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    dto.id = id;
    return await this.ordersService.update(dto);
  }

  @Patch(':id/cancel')
  async cancel(@Param('id') id: string) {
    return await this.ordersService.cancel(id);
  }

  @Patch(':id/mark-paid')
  async markAsPaid(@Param('id') id: string) {
    return await this.ordersService.markAsPaid(id);
  }

  @Patch(':id/mark-shipped')
  async markAsShipped(@Param('id') id: string, @Body('transportId') transportId?: string) {
    return await this.ordersService.markAsShipped(id, transportId);
  }

  @Patch(':id/mark-delivered')
  async markAsDelivered(@Param('id') id: string) {
    return await this.ordersService.markAsDelivered(id);
  }

  @Patch(':id/refund')
  async refund(@Param('id') id: string) {
    return await this.ordersService.refund(id);
  }

  @Patch(':id/confirm-delivery')
  async confirmDelivery(@Param('id') id: string, @Body('userId') userId: string) {
    return await this.ordersService.confirmDelivery(id, userId);
  }
}
