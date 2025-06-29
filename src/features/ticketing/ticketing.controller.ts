import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { TicketingService } from './ticketing.service';
import { Ticket } from './entities/ticketing.entity';
import { AuthenticationGuard } from 'src/features/auth/guards/auth.guard';
import { TicketStatus } from './enums/ticket-status.enum';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { FindManyOptions } from 'src/libs/repository/interfaces/base-repo-options.interface';

@Controller('tickets')
@UseGuards(AuthenticationGuard)
export class TicketingController {
  constructor(private readonly ticketingService: TicketingService) {}

  @Post()
  async create(@Body() createTicketDto: CreateTicketDto): Promise<Ticket> {
    const ticket = await this.ticketingService.create(createTicketDto);
    return ticket;
  }

  @Get()
  async findAll(@Body() options: FindManyOptions): Promise<Ticket[]> {
    const tickets = await this.ticketingService.findAll(options);
    return tickets;
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Ticket | null> {
    const ticket = await this.ticketingService.findOne(id);
    return ticket;
  }

  @Get(':id/status')
  async findStatus(@Param('id') id: string): Promise<TicketStatus> {
    const status = await this.ticketingService.findStatus(id);
    return status;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ): Promise<Ticket | null> {
    const updatedTicket = await this.ticketingService.update(id, updateTicketDto);
    return updatedTicket;
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: TicketStatus,
  ): Promise<Ticket | null> {
    const updatedStatus = await this.ticketingService.updateStatus(id, status);
    return updatedStatus;
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<boolean> {
    const removedTicket = await this.ticketingService.remove(id);
    return removedTicket;
  }

  @Post(':id/escalate')
  async escalateTicket(@Param('id') ticketId: string): Promise<Ticket> {
    const escalatedTicket = await this.ticketingService.escalateTicket(ticketId);
    return escalatedTicket;
  }
}
