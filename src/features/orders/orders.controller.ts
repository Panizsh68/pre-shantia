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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { IOrdersService } from './interfaces/order.service.interface';
import { Order } from './entities/order.entity';
import { AuthenticationGuard } from '../auth/guards/auth.guard';
import { Permission } from '../permissions/decoratorss/permissions.decorators';
import { PermissionsGuard } from '../permissions/guard/permission.guard';
import { Resource } from '../permissions/enums/resources.enum';
import { Action } from '../permissions/enums/actions.enum';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(@Inject('IOrdersService') private readonly ordersService: IOrdersService) { }

  @Post()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.ORDERS, Action.DEFAULT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: 'Order created successfully', type: Order })
  async create(@Body() dto: CreateOrderDto) {
    return await this.ordersService.create(dto);
  }

  @Get(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.ORDERS, Action.DEFAULT)
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order found', type: Order })
  async getById(@Param('id') id: string) {
    return await this.ordersService.findById(id);
  }

  @Get()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.ORDERS, Action.DEFAULT)
  @ApiOperation({ summary: 'Find orders by userId or companyId' })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Orders found', type: [Order] })
  async find(@Query('userId') userId?: string, @Query('companyId') companyId?: string) {
    if (userId) {
      return await this.ordersService.findByUserId(userId);
    }
    if (companyId) {
      return await this.ordersService.findByCompanyId(companyId);
    }
    return [];
  }

  // @Patch(':id')
  // @UseGuards(AuthenticationGuard, PermissionsGuard)
  // @Permission(Resource.ORDERS, Action.UPDATE)
  // @ApiOperation({ summary: 'Update an order by ID' })
  // @ApiParam({ name: 'id', description: 'Order ID' })
  // @ApiBody({ type: UpdateOrderDto })
  // @ApiResponse({ status: 200, description: 'Order updated successfully', type: Order })
  // async update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
  //   dto.id = id;
  //   return await this.ordersService.update(dto);
  // }

  @Patch(':id/mark-paid')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.ORDERS, Action.UPDATE)
  @ApiOperation({ summary: 'Mark order as paid' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order marked as paid' })
  async markAsPaid(@Param('id') id: string) {
    return await this.ordersService.markAsPaid(id);
  }

  @Patch(':id/mark-shipped')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.ORDERS, Action.UPDATE)
  @ApiOperation({ summary: 'Mark order as shipped' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        transportId: { type: 'string', example: 'transport_123' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Order marked as shipped' })
  async markAsShipped(@Param('id') id: string, @Body('transportId') transportId?: string) {
    return await this.ordersService.markAsShipped(id, transportId);
  }

  @Patch(':id/mark-delivered')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.ORDERS, Action.UPDATE)
  @ApiOperation({ summary: 'Mark order as delivered' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order marked as delivered' })
  async markAsDelivered(@Param('id') id: string) {
    return await this.ordersService.markAsDelivered(id);
  }

  @Patch(':id/refund')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.ORDERS, Action.UPDATE)
  @ApiOperation({ summary: 'Refund an order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order refunded' })
  async refund(@Param('id') id: string) {
    return await this.ordersService.refund(id);
  }

  @Patch(':id/confirm-delivery')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.ORDERS, Action.UPDATE)
  @ApiOperation({ summary: 'User confirms delivery of order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: 'user_123' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Order delivery confirmed by user' })
  async confirmDelivery(@Param('id') id: string, @Body('userId') userId: string) {
    return await this.ordersService.confirmDelivery(id, userId);
  }
}
