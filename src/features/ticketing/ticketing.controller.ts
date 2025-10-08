import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Inject, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { Ticket } from './entities/ticketing.entity';
import { TicketResponseDto } from './dto/ticket-response.dto';
import { ticketToResponseDto } from './mappers/ticket.mapper';
import { TicketStatusResponseDto } from './dto/ticket-status-response.dto';
import { AuthenticationGuard } from 'src/features/auth/guards/auth.guard';
import { TicketStatus } from './enums/ticket-status.enum';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { ITicketingService } from './interfaces/ticketing.service.interface';
import { FindManyOptions } from 'src/libs/repository/interfaces/base-repo-options.interface';
import { Permission } from '../permissions/decorators/permissions.decorators';
import { PermissionsGuard } from '../permissions/guard/permission.guard';
import { Resource } from '../permissions/enums/resources.enum';
import { Action } from '../permissions/enums/actions.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { TokenPayload } from 'src/features/auth/interfaces/token-payload.interface';

@ApiTags('Tickets')
@Controller('tickets')
export class TicketingController {
  constructor(
    @Inject('ITicketingService')
    private readonly ticketingService: ITicketingService,
  ) { }

  @Post()
  // Only require authentication to create tickets (users can open tickets without special permissions)
  @UseGuards(AuthenticationGuard)
  @ApiOperation({ summary: 'Create a new ticket' })
  @ApiBody({ type: CreateTicketDto })
  @ApiResponse({ status: 201, description: 'Ticket created successfully', type: TicketResponseDto })
  async create(@CurrentUser() user: TokenPayload, @Body() createTicketDto: CreateTicketDto): Promise<TicketResponseDto> {
    // enforce createdBy from authenticated user
    createTicketDto.createdBy = user.userId;
    const ticket = await this.ticketingService.create(createTicketDto);
    return ticketToResponseDto(ticket);
  }

  @Get()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TICKETING, Action.READ)
  @ApiOperation({ summary: 'Get all tickets (with optional filters)', description: 'This route is open for default users.' })
  @ApiResponse({ status: 200, description: 'List of tickets returned', type: TicketResponseDto, isArray: true })
  async findAll(@Query() options: FindManyOptions): Promise<TicketResponseDto[]> {
    const tickets = await this.ticketingService.findAll(options);
    return tickets.map(ticketToResponseDto);
  }

  @Get(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TICKETING, Action.READ)
  @ApiOperation({ summary: 'Get a ticket by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Ticket found', type: TicketResponseDto })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async findOne(@Param('id') id: string): Promise<TicketResponseDto | null> {
    const t = await this.ticketingService.findOne(id);
    if (!t) return null;
    return ticketToResponseDto(t);
  }

  @Get(':id/status')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TICKETING, Action.READ)
  @ApiOperation({ summary: 'Get status of a ticket by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Ticket status returned', type: TicketStatusResponseDto })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async findStatus(@Param('id') id: string): Promise<TicketStatusResponseDto> {
    const status = await this.ticketingService.findStatus(id);
    return { status };
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @Permission(Resource.TICKETING, Action.UPDATE)
  @ApiOperation({ summary: 'Patch ticket by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateTicketDto })
  @ApiResponse({ status: 200, description: 'Ticket updated successfully', type: TicketResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ): Promise<TicketResponseDto | null> {
    const t = await this.ticketingService.update(id, updateTicketDto);
    if (!t) return null;
    return ticketToResponseDto(t);
  }

  @Patch(':id/status')
  @UseGuards(PermissionsGuard)
  @Permission(Resource.TICKETING, Action.UPDATE)
  @ApiOperation({ summary: 'Patch ticket status' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(TicketStatus),
          example: TicketStatus.Open,
        },
        refund: { type: 'boolean', description: 'When resolving a ticket related to an order, set true to refund to user, false to release to company' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Ticket status updated', type: TicketResponseDto })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: TicketStatus,
    @Body('refund') refund?: boolean,
  ): Promise<TicketResponseDto | null> {
    const t = await this.ticketingService.updateStatus(id, status, refund);
    if (!t) return null;
    return ticketToResponseDto(t);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Permission(Resource.TICKETING, Action.DELETE)
  @ApiOperation({ summary: 'Delete ticket by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Ticket deleted successfully' })
  async delete(@Param('id') id: string): Promise<boolean> {
    return this.ticketingService.remove(id);
  }

  @Post(':id/escalate')
  @UseGuards(PermissionsGuard)
  @Permission(Resource.TICKETING, Action.UPDATE)
  @ApiOperation({ summary: 'Escalate a ticket to a higher level' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Ticket escalated' })
  async escalateTicket(@Param('id') ticketId: string): Promise<TicketResponseDto> {
    const t = await this.ticketingService.escalateTicket(ticketId);
    return ticketToResponseDto(t);
  }

  @Patch(':id/resolve')
  @UseGuards(PermissionsGuard)
  @Permission(Resource.TICKETING, Action.UPDATE)
  @ApiOperation({ summary: 'Admin resolve a ticket (refund or release funds)' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refund: { type: 'boolean', description: 'true => refund to user, false => release to company' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Ticket resolved' })
  async adminResolve(
    @Param('id') id: string,
    @Body('refund') refund: boolean,
  ): Promise<TicketResponseDto | { success: boolean }> {
    // delegate to strong-typed service method which updates status and handles funds
    await this.ticketingService.resolveTicket(id, !!refund);
    const t = await this.ticketingService.findOne(id);
    if (!t) return { success: false };
    return ticketToResponseDto(t);
  }
}
