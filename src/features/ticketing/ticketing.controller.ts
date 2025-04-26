import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { TicketingService } from './ticketing.service';
import { Ticket } from './entities/ticketing.entity';
import { AuthenticationGuard } from 'src/features/users/auth/guards/auth.guard';
import { TicketStatus } from './enums/ticket-status.enum';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Controller('tickets')
@UseGuards(AuthenticationGuard)
export class TicketingController {
  constructor(private readonly ticketingService: TicketingService) {}

  @Post()
  async createTicket(@Body() createTicketDto: CreateTicketDto): Promise<Ticket> {
    return await this.ticketingService.create(createTicketDto);
  }

  @Get()
  async findAllTickets(): Promise<Ticket[]> {
    return await this.ticketingService.findAll();
  }

  @Get(':id')
  async findTicketById(@Param('id') id: string): Promise<Ticket | null> {
    return await this.ticketingService.findById(id);
  }

  @Get(':id/status')
  async findTicketStatus(@Param('id') id: string): Promise<TicketStatus> {
    return await this.ticketingService.findStatus(id)
  }
  
  @Put(':id')
  async updateTicket(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto)
  : Promise<Ticket | null> {
    return await this.ticketingService.update(id, updateTicketDto);
  }

  @Put(':id/status')
  async updateTicketStatus(@Param('id') id: string, @Body('status') status: TicketStatus)
  : Promise<Ticket | null> {
    return await this.ticketingService.updateStatus(id, status);
  }

  @Delete(':id')
  async deleteTicket(@Param('id') id: string): Promise<boolean> {
    return await this.ticketingService.remove(id);
  }

  @Post(':id/escalate')
  async escalateTicket(@Param('id') ticketId: string): Promise<Ticket> {
    return await this.ticketingService.escalateTicket(ticketId);
  }
}
