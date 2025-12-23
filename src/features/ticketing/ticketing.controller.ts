import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Inject, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
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
import { IUsersService } from '../users/interfaces/user.service.interface';
import { CreateTicketCommentDto } from './dto/create-ticket-comment.dto';
import { TicketCommentDto } from './dto/ticket-comment.dto';
import { hasPermission, isSuperAdmin } from 'src/common/utils/auth-helpers';

@ApiBearerAuth()
@ApiTags('Tickets')
@Controller('tickets')
export class TicketingController {
  constructor(
    @Inject('ITicketingService')
    private readonly ticketingService: ITicketingService,
    @Inject('IUsersService')
    private readonly usersService: IUsersService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Helper to get superadmin user by phone and melicode
   */
  private async getSuperAdmin() {
    const superPhone = this.configService.get<string>('SUPERADMIN_PHONE');
    const superMelicode = this.configService.get<string>('SUPERADMIN_MELICODE');
    if (!superPhone || !superMelicode) {
      throw new BadRequestException('SUPERADMIN_PHONE or SUPERADMIN_MELICODE not configured');
    }
    const superAdmin = await this.usersService.findUserByPhoneNumber(superPhone);
    if (!superAdmin || superAdmin.nationalId !== superMelicode) {
      throw new BadRequestException('Superadmin user not found in system');
    }
    return superAdmin;
  }

  @Post()
  // Only require authentication to create tickets (users can open tickets without special permissions)
  @UseGuards(AuthenticationGuard)
  @ApiOperation({ summary: 'Create a new ticket', description: 'Creates a new support ticket. Ticket is automatically assigned to superadmin.' })
  @ApiBody({ type: CreateTicketDto })
  @ApiResponse({ status: 201, description: 'Ticket created successfully', type: TicketResponseDto })
  async create(@CurrentUser() user: TokenPayload, @Body() createTicketDto: CreateTicketDto): Promise<TicketResponseDto> {
    // Get superadmin to assign ticket
    const superAdmin = await this.getSuperAdmin();

    // Set createdBy from authenticated user and assignedTo to superadmin
    createTicketDto.createdBy = user.userId;
    createTicketDto.assignedTo = superAdmin.id.toString();
    
    const ticket = await this.ticketingService.create(createTicketDto);
    return ticketToResponseDto(ticket);
  }

  @Get()
  @UseGuards(AuthenticationGuard)
  @ApiOperation({ 
    summary: 'Get tickets', 
    description: 'Regular users see only their own tickets. Superadmin/staff with TICKETING.READ permission see all tickets.' 
  })
  @ApiResponse({ status: 200, description: 'List of tickets returned', type: TicketResponseDto, isArray: true })
  async findAll(
    @CurrentUser() user: TokenPayload,
    @Query() options: FindManyOptions
  ): Promise<TicketResponseDto[]> {
    // Superadmin or user with TICKETING.READ can see all tickets
    const canSeeAll = hasPermission(user, Resource.TICKETING, Action.READ);

    // If not authorized to see all, filter by createdBy
    if (!canSeeAll) {
      if (!options.conditions) {
        options.conditions = {};
      }
      options.conditions.createdBy = user.userId;
    }

    const tickets = await this.ticketingService.findAll(options);
    return tickets.map(ticketToResponseDto);
  }

  @Get(':id')
  @UseGuards(AuthenticationGuard)
  @ApiOperation({ summary: 'Get a ticket by ID', description: 'Users can only see tickets they created. Admins can see any ticket.' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Ticket found', type: TicketResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - ticket belongs to another user' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async findOne(@CurrentUser() user: TokenPayload, @Param('id') id: string): Promise<TicketResponseDto> {
    const t = await this.ticketingService.findOne(id);
    if (!t) {
      throw new BadRequestException('Ticket not found');
    }

    // Superadmin or TICKETING.READ can see all tickets
    const canSeeAll = hasPermission(user, Resource.TICKETING, Action.READ);

    // Regular users can only see their own tickets
    if (!canSeeAll && t.createdBy !== user.userId) {
      throw new BadRequestException('Forbidden - you can only see your own tickets');
    }

    return ticketToResponseDto(t);
  }

  @Get(':id/status')
  @UseGuards(AuthenticationGuard)
  @ApiOperation({ summary: 'Get status of a ticket by ID', description: 'Users can only check status of their own tickets.' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Ticket status returned', type: TicketStatusResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - ticket belongs to another user' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async findStatus(@CurrentUser() user: TokenPayload, @Param('id') id: string): Promise<TicketStatusResponseDto> {
    const ticket = await this.ticketingService.findOne(id);
    if (!ticket) {
      throw new BadRequestException('Ticket not found');
    }

    // Superadmin or TICKETING.READ can check any ticket status
    const canSeeAll = hasPermission(user, Resource.TICKETING, Action.READ);

    // Regular users can only check their own ticket status
    if (!canSeeAll && ticket.createdBy !== user.userId) {
      throw new BadRequestException('Forbidden - you can only check your own tickets');
    }

    const status = await this.ticketingService.findStatus(id);
    return { status };
  }

  @Patch(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TICKETING, Action.UPDATE)
  @ApiOperation({ summary: 'Update a ticket', description: 'Admins/staff can update ticket details. Regular users can add replies.' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateTicketDto })
  @ApiResponse({ status: 200, description: 'Ticket updated successfully', type: TicketResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ): Promise<TicketResponseDto> {
    const t = await this.ticketingService.update(id, updateTicketDto);
    if (!t) {
      throw new BadRequestException('Ticket not found');
    }
    return ticketToResponseDto(t);
  }

  @Patch(':id/status')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TICKETING, Action.UPDATE)
  @ApiOperation({ summary: 'Update ticket status', description: 'Only admins/staff can update ticket status.' })
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
  @ApiResponse({ status: 403, description: 'Forbidden - only admins can update status' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: TicketStatus,
    @Body('refund') refund?: boolean,
  ): Promise<TicketResponseDto> {
    const t = await this.ticketingService.updateStatus(id, status, refund);
    if (!t) {
      throw new BadRequestException('Ticket not found');
    }
    return ticketToResponseDto(t);
  }

  @Delete(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TICKETING, Action.DELETE)
  @ApiOperation({ summary: 'Delete a ticket', description: 'Only admins/staff can delete tickets.' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Ticket deleted successfully', schema: { type: 'boolean' } })
  @ApiResponse({ status: 403, description: 'Forbidden - only admins can delete tickets' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async delete(@Param('id') id: string): Promise<boolean> {
    const result = await this.ticketingService.remove(id);
    if (!result) {
      throw new BadRequestException('Ticket not found');
    }
    return result;
  }

  @Post(':id/escalate')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TICKETING, Action.UPDATE)
  @ApiOperation({ summary: 'Escalate a ticket to higher priority', description: 'Only admins/staff can escalate tickets.' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Ticket escalated', type: TicketResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - only admins can escalate tickets' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async escalateTicket(@Param('id') ticketId: string): Promise<TicketResponseDto> {
    const t = await this.ticketingService.escalateTicket(ticketId);
    return ticketToResponseDto(t);
  }

  @Patch(':id/resolve')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TICKETING, Action.UPDATE)
  @ApiOperation({ summary: 'Resolve a ticket', description: 'Admins handle refunds/releases for order-related tickets.' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refund: { type: 'boolean', description: 'true => refund to user, false => release to company' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Ticket resolved', type: TicketResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - only admins can resolve tickets' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async adminResolve(
    @Param('id') id: string,
    @Body('refund') refund: boolean,
  ): Promise<TicketResponseDto> {
    await this.ticketingService.resolveTicket(id, !!refund);
    const t = await this.ticketingService.findOne(id);
    if (!t) {
      throw new BadRequestException('Ticket not found');
    }
    return ticketToResponseDto(t);
  }

  @Post(':id/comments')
  @UseGuards(AuthenticationGuard)
  @ApiOperation({
    summary: 'Add a comment/reply to a ticket',
    description: 'Both users and admins can add comments. Creates a two-way conversation thread.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: CreateTicketCommentDto })
  @ApiResponse({ status: 201, description: 'Comment added successfully', type: TicketResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - can only comment on own tickets (unless admin)' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async addComment(
    @CurrentUser() user: TokenPayload,
    @Param('id') ticketId: string,
    @Body() createCommentDto: CreateTicketCommentDto,
  ): Promise<TicketResponseDto> {
    const ticket = await this.ticketingService.findOne(ticketId);
    if (!ticket) {
      throw new BadRequestException('Ticket not found');
    }

    // Superadmin or TICKETING.UPDATE can comment on any ticket
    const canUpdateAll = hasPermission(user, Resource.TICKETING, Action.UPDATE);

    // Regular users can only comment on their own tickets
    if (!canUpdateAll && ticket.createdBy !== user.userId) {
      throw new BadRequestException('Forbidden - you can only comment on your own tickets');
    }

    const updated = await this.ticketingService.addComment(ticketId, user.userId, createCommentDto.content);
    if (!updated) {
      throw new BadRequestException('Failed to add comment');
    }
    return ticketToResponseDto(updated);
  }

  @Get(':id/comments')
  @UseGuards(AuthenticationGuard)
  @ApiOperation({
    summary: 'Get all comments on a ticket',
    description: 'Users can view comments on their own tickets. Admins can view any ticket comments.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Comments retrieved', type: [TicketCommentDto] })
  @ApiResponse({ status: 403, description: 'Forbidden - can only view own ticket comments (unless admin)' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async getComments(
    @CurrentUser() user: TokenPayload,
    @Param('id') ticketId: string,
  ): Promise<TicketCommentDto[]> {
    const ticket = await this.ticketingService.findOne(ticketId);
    if (!ticket) {
      throw new BadRequestException('Ticket not found');
    }

    // Superadmin or TICKETING.READ can view any ticket comments
    const canSeeAll = hasPermission(user, Resource.TICKETING, Action.READ);

    // Regular users can only view comments on their own tickets
    if (!canSeeAll && ticket.createdBy !== user.userId) {
      throw new BadRequestException('Forbidden - you can only view comments on your own tickets');
    }

    const comments = await this.ticketingService.getComments(ticketId);
    return comments.map(c => ({
      id: c.id?.toString() || '',
      userId: c.userId,
      content: c.content,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })) || [];
  }}