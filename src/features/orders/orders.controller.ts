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
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Get()
  find(@Query('userId') userId?: string, @Query('companyId') companyId?: string) {
    if (userId) {
      return this.ordersService.findByUserId(userId);
    }
    if (companyId) {
      return this.ordersService.findByCompanyId(companyId);
    }
    return [];
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    dto.id = id;
    return this.ordersService.update(dto);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.ordersService.cancel(id);
  }

  @Patch(':id/mark-paid')
  markAsPaid(@Param('id') id: string) {
    return this.ordersService.markAsPaid(id);
  }

  @Patch(':id/mark-shipped')
  markAsShipped(@Param('id') id: string, @Body('transportId') transportId?: string) {
    return this.ordersService.markAsShipped(id, transportId);
  }

  @Patch(':id/mark-delivered')
  markAsDelivered(@Param('id') id: string) {
    return this.ordersService.markAsDelivered(id);
  }

  @Patch(':id/refund')
  refund(@Param('id') id: string) {
    return this.ordersService.refund(id);
  }

  @Patch(':id/confirm-delivery')
  confirmDelivery(@Param('id') id: string, @Body('userId') userId: string) {
    return this.ordersService.confirmDelivery(id, userId);
  }
}
