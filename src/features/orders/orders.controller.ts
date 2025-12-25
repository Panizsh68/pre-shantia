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
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { IOrdersService } from './interfaces/order.service.interface';
import { Order } from './entities/order.entity';
import { AuthenticationGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { TokenPayload } from '../auth/interfaces/token-payload.interface';
import { Permission } from '../permissions/decorators/permissions.decorators';
import { PermissionsGuard } from '../permissions/guard/permission.guard';
import { Resource } from '../permissions/enums/resources.enum';
import { Action } from '../permissions/enums/actions.enum';
import { hasPermission, isSuperAdmin } from 'src/common/utils/auth-helpers';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(@Inject('IOrdersService') private readonly ordersService: IOrdersService) { }

  @Post()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.ORDERS, Action.CREATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new order', description: 'This route is open for default users.' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: 'Order created successfully', type: Order })
  async create(@Body() dto: CreateOrderDto) {
    return await this.ordersService.create(dto);
  }

  @Get(':id')
  @UseGuards(AuthenticationGuard)
  @ApiOperation({ summary: 'Get order by ID', description: 'Regular users can only access their own orders.' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order found', type: Order })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot access another user\'s order' })
  async getById(@CurrentUser() user: TokenPayload, @Param('id') id: string) {
    const order = await this.ordersService.findById(id);
    
    // Owner check: user can only see their own orders unless they're superadmin
    if (order.userId !== user.userId && !isSuperAdmin(user)) {
      throw new ForbiddenException('Cannot access another user\'s order');
    }
    
    return order;
  }

  @Get()
  @UseGuards(AuthenticationGuard)
  @ApiOperation({ 
    summary: 'Find orders by userId or companyId',
    description: 'Regular users see only their own orders. Admins see all.'
  })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Orders found', type: [Order] })
  async find(@CurrentUser() user: TokenPayload, @Query('userId') userId?: string, @Query('companyId') companyId?: string) {
    const isAdmin = hasPermission(user, Resource.ORDERS, Action.READ);
    
    // Regular users can only see their own orders
    if (!isAdmin) {
      return await this.ordersService.findByUserId(user.userId);
    }
    
    // Admins can filter by userId or companyId
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
  @ApiResponse({ status: 200, description: 'Order delivery confirmed by user' })
  async confirmDelivery(@Param('id') id: string, @CurrentUser() user: TokenPayload) {
    return await this.ordersService.confirmDelivery(id, user.userId);
  }
}
