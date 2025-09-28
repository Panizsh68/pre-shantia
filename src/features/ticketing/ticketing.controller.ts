import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { Ticket } from './entities/ticketing.entity';
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

@ApiTags('Tickets')
@Controller('tickets')
export class TicketingController {
  constructor(
    @Inject('ITicketingService')
    private readonly ticketingService: ITicketingService,
  ) { }

  @Post()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TICKETING, Action.CREATE)
  @ApiOperation({ summary: 'Create a new ticket' })
  @ApiBody({ type: CreateTicketDto })
  @ApiResponse({ status: 201, description: 'Ticket created successfully' })
  async create(@Body() createTicketDto: CreateTicketDto): Promise<Ticket> {
    return this.ticketingService.create(createTicketDto);
  }

  @Get()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TICKETING, Action.READ)
  @ApiOperation({ summary: 'Get all tickets (with optional filters)', description: 'This route is open for default users.' })
  @ApiResponse({ status: 200, description: 'List of tickets returned' })
  async findAll(@Body() options: FindManyOptions): Promise<Ticket[]> {
    return this.ticketingService.findAll(options);
  }

  @Get(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TICKETING, Action.READ)
  @ApiOperation({ summary: 'Get a ticket by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Ticket found' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async findOne(@Param('id') id: string): Promise<Ticket | null> {
    return this.ticketingService.findOne(id);
  }

  @Get(':id/status')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TICKETING, Action.READ)
  @ApiOperation({ summary: 'Get status of a ticket by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Ticket status returned' })
  async findStatus(@Param('id') id: string): Promise<TicketStatus> {
    return this.ticketingService.findStatus(id);
  }

  @Put(':id')
  @UseGuards(PermissionsGuard)
  @Permission(Resource.TICKETING, Action.UPDATE)
  @ApiOperation({ summary: 'Update ticket by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateTicketDto })
  @ApiResponse({ status: 200, description: 'Ticket updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ): Promise<Ticket | null> {
    return this.ticketingService.update(id, updateTicketDto);
  }

  @Put(':id/status')
  @UseGuards(PermissionsGuard)
  @Permission(Resource.TICKETING, Action.UPDATE)
  @ApiOperation({ summary: 'Update ticket status' })
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
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Ticket status updated' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: TicketStatus,
  ): Promise<Ticket | null> {
    return this.ticketingService.updateStatus(id, status);
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
  async escalateTicket(@Param('id') ticketId: string): Promise<Ticket> {
    return this.ticketingService.escalateTicket(ticketId);
  }
}
