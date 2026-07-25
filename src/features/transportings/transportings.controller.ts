import { Controller, Post, Get, Patch, Param, Body, Inject, UseGuards, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreateTransportingDto } from './dto/create-transporting.dto';
import { UpdateTransportingDto } from './dto/update-transporting.dto';
import { ITransporting } from './interfaces/transporting.interface';
import { ITransportService } from './interfaces/transporting.service.interface';
import { AuthenticationGuard } from '../auth/guards/auth.guard';
import { Permission } from '../permissions/decorators/permissions.decorators';
import { PermissionsGuard } from '../permissions/guard/permission.guard';
import { Resource } from '../permissions/enums/resources.enum';
import { Action } from '../permissions/enums/actions.enum';

@ApiTags('Transport')
@ApiBearerAuth()
@Controller('transport')
export class TransportController {
  constructor(
    @Inject('ITransportService') private readonly transportService: ITransportService,
  ) { }

  @Post()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TRANSPORTING, Action.CREATE)
  @ApiOperation({ summary: 'Create a new transport record' })
  @ApiBody({ type: CreateTransportingDto })
  @ApiResponse({ status: 201, description: 'Transport record created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createTransportingDto: CreateTransportingDto): Promise<ITransporting> {
    return this.transportService.create(createTransportingDto);
  }

  @Get()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TRANSPORTING, Action.READ)
  @ApiOperation({ summary: 'Get all transport records with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Paginated transport records returned' })
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const parsedPage = page === undefined ? 1 : Number(page);
    const parsedLimit = limit === undefined ? 20 : Number(limit);
    if (!Number.isInteger(parsedPage) || parsedPage < 1 || !Number.isInteger(parsedLimit) || parsedLimit < 1) {
      throw new BadRequestException('page and limit must be positive integers');
    }
    return this.transportService.findAll(parsedPage, parsedLimit);
  }

  @Get(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TRANSPORTING, Action.READ)
  @ApiOperation({ summary: 'Get transport record by ID' })
  @ApiParam({ name: 'id', description: 'Transport ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Transport record found' })
  @ApiResponse({ status: 404, description: 'Transport record not found' })
  async findById(@Param('id') id: string): Promise<ITransporting> {
    return this.transportService.findById(id);
  }

  @Get('order/:orderId')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TRANSPORTING, Action.READ)
  @ApiOperation({ summary: 'Get transport record by order ID' })
  @ApiParam({ name: 'orderId', description: 'Order ID', example: '507f1f77bcf86cd799439012' })
  @ApiResponse({ status: 200, description: 'Transport record found' })
  @ApiResponse({ status: 404, description: 'Transport record not found' })
  async findByOrderId(@Param('orderId') orderId: string): Promise<ITransporting> {
    return this.transportService.findByOrderId(orderId);
  }

  @Get('company/:companyId')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TRANSPORTING, Action.detailed_read)
  @ApiOperation({ summary: 'Get transport records by company ID' })
  @ApiParam({ name: 'companyId', description: 'Company ID', example: '507f1f77bcf86cd799439013' })
  @ApiResponse({ status: 200, description: 'List of transport records found' })
  @ApiResponse({ status: 404, description: 'No transport records found for the company' })
  async findByCompanyId(@Param('companyId') companyId: string): Promise<ITransporting[]> {
    return this.transportService.findByCompanyId(companyId);
  }

  @Patch()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TRANSPORTING, Action.UPDATE)
  @ApiOperation({ summary: 'Update a transport record' })
  @ApiBody({ type: UpdateTransportingDto })
  @ApiResponse({ status: 200, description: 'Transport record updated successfully' })
  @ApiResponse({ status: 404, description: 'Transport record not found' })
  async update(@Body() updateTransportingDto: UpdateTransportingDto): Promise<ITransporting> {
    return this.transportService.update(updateTransportingDto);
  }

  @Patch(':id/cancel')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TRANSPORTING, Action.UPDATE)
  @ApiOperation({ summary: 'Cancel a transport record' })
  @ApiParam({ name: 'id', description: 'Transport ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Transport record canceled successfully' })
  @ApiResponse({ status: 404, description: 'Transport record not found' })
  @ApiResponse({ status: 400, description: 'Transport record cannot be canceled' })
  async cancel(@Param('id') id: string): Promise<ITransporting> {
    return this.transportService.cancel(id);
  }

  @Patch(':id/delivered')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TRANSPORTING, Action.UPDATE)
  @ApiOperation({ summary: 'Mark a transport record as delivered' })
  @ApiParam({ name: 'id', description: 'Transport ID', example: '507f1f77bcf86cd799439011' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { estimatedDelivery: { type: 'string', format: 'date-time' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Transport record marked as delivered successfully' })
  @ApiResponse({ status: 404, description: 'Transport record not found' })
  @ApiResponse({ status: 400, description: 'Transport record cannot be marked as delivered' })
  async markAsDelivered(
    @Param('id') id: string,
    @Body('estimatedDelivery') estimatedDelivery?: Date,
  ): Promise<ITransporting> {
    return this.transportService.markAsDelivered(id, estimatedDelivery);
  }
}
