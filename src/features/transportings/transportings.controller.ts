import { Controller, Post, Get, Patch, Param, Body, Inject, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateTransportingDto } from './dto/create-transporting.dto';
import { UpdateTransportingDto } from './dto/update-transporting.dto';
import { ITransporting } from './interfaces/transporting.interface';
import { ITransportingsService } from './interfaces/transporting.service.interface';
import { AuthenticationGuard } from '../auth/guards/auth.guard';
import { Permission } from '../permissions/decoratorss/permissions.decorators';
import { PermissionsGuard } from '../permissions/guard/permission.guard';
import { Resource } from '../permissions/enums/resources.enum';
import { Action } from '../permissions/enums/actions.enum';

@ApiTags('transportings')
@Controller('transportings')
export class TransportingsController {
  constructor(
    @Inject('ITransportingsService') private readonly transportingsService: ITransportingsService,
  ) { }

  @Post()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TRANSPORTING, Action.CREATE)
  @ApiOperation({ summary: 'Create a new transporting record' })
  @ApiBody({ type: CreateTransportingDto })
  @ApiResponse({ status: 201, description: 'Transporting record created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createTransportingDto: CreateTransportingDto): Promise<ITransporting> {
    return this.transportingsService.create(createTransportingDto);
  }

  @Get(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TRANSPORTING, Action.DEFAULT)
  @ApiOperation({ summary: 'Get transporting record by ID', description: 'This route is open for default users.' })
  @ApiParam({ name: 'id', description: 'Transporting ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Transporting record found' })
  @ApiResponse({ status: 404, description: 'Transporting record not found' })
  async findById(@Param('id') id: string): Promise<ITransporting> {
    return this.transportingsService.findById(id);
  }

  @Get('order/:orderId')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TRANSPORTING, Action.DEFAULT)
  @ApiOperation({ summary: 'Get transporting record by order ID', description: 'This route is open for default users.' })
  @ApiParam({ name: 'orderId', description: 'Order ID', example: '507f1f77bcf86cd799439012' })
  @ApiResponse({ status: 200, description: 'Transporting record found' })
  @ApiResponse({ status: 404, description: 'Transporting record not found' })
  async findByOrderId(@Param('orderId') orderId: string): Promise<ITransporting> {
    return this.transportingsService.findByOrderId(orderId);
  }

  @Get('company/:companyId')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TRANSPORTING, Action.DEFAULT)
  @ApiOperation({ summary: 'Get transporting records by company ID' })
  @ApiParam({ name: 'companyId', description: 'Company ID', example: '507f1f77bcf86cd799439013' })
  @ApiResponse({ status: 200, description: 'List of transporting records found' })
  @ApiResponse({ status: 404, description: 'No transporting records found for the company' })
  async findByCompanyId(@Param('companyId') companyId: string): Promise<ITransporting[]> {
    return this.transportingsService.findByCompanyId(companyId);
  }

  @Patch()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TRANSPORTING, Action.UPDATE)
  @ApiOperation({ summary: 'Update a transporting record' })
  @ApiBody({ type: UpdateTransportingDto })
  @ApiResponse({ status: 200, description: 'Transporting record updated successfully' })
  @ApiResponse({ status: 404, description: 'Transporting record not found' })
  async update(@Body() updateTransportingDto: UpdateTransportingDto): Promise<ITransporting> {
    return this.transportingsService.update(updateTransportingDto);
  }

  @Patch(':id/cancel')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TRANSPORTING, Action.UPDATE)
  @ApiOperation({ summary: 'Cancel a transporting record' })
  @ApiParam({ name: 'id', description: 'Transporting ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Transporting record canceled successfully' })
  @ApiResponse({ status: 404, description: 'Transporting record not found' })
  @ApiResponse({ status: 400, description: 'Transporting record cannot be canceled' })
  async cancel(@Param('id') id: string): Promise<ITransporting> {
    return this.transportingsService.cancel(id);
  }

  @Patch(':id/delivered')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TRANSPORTING, Action.UPDATE)
  @ApiOperation({ summary: 'Mark a transporting record as delivered' })
  @ApiParam({ name: 'id', description: 'Transporting ID', example: '507f1f77bcf86cd799439011' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { estimatedDelivery: { type: 'string', format: 'date-time' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Transporting record marked as delivered successfully' })
  @ApiResponse({ status: 404, description: 'Transporting record not found' })
  @ApiResponse({ status: 400, description: 'Transporting record cannot be marked as delivered' })
  async markAsDelivered(
    @Param('id') id: string,
    @Body('estimatedDelivery') estimatedDelivery?: Date,
  ): Promise<ITransporting> {
    return this.transportingsService.markAsDelivered(id, estimatedDelivery);
  }
}
