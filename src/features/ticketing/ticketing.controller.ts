import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { TicketingService } from './ticketing.service';
import { Ticket } from './entities/ticketing.entity';
import { AuthenticationGuard } from 'src/features/users/auth/guards/auth.guard';
import { TicketStatus } from './enums/ticket-status.enum';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { DeleteResult, UpdateResult } from 'mongoose';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Controller('tickets')
@UseGuards(AuthenticationGuard)
export class TicketingController {
  constructor(private readonly ticketingService: TicketingService) {}

  @Post()
  async createTicket(@Body() createTicketDto: CreateTicketDto): Promise<Ticket> {
    return await this.ticketingService.createTicket(createTicketDto);
  }

  @Get()
  async findAllTickets(): Promise<Ticket[]> {
    return await this.ticketingService.findAllTickets();
  }

  @Get(':id')
  async findTicketById(@Param('id') id: string): Promise<Ticket> {
    return await this.ticketingService.findTicketById(id);
  }

  @Get(':id/status')
  async findTicketStatus(@Param('id') id: string): Promise<TicketStatus> {
    return await this.ticketingService.findTicketStatus(id)
  }
  
  @Put(':id')
  async updateTicket(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto)
  : Promise<UpdateResult> {
    return await this.ticketingService.updateTicket(id, updateTicketDto);
  }

  @Put(':id/status')
  async updateTicketStatus(@Param('id') id: string, @Body('status') status: TicketStatus)
  : Promise<UpdateResult> {
    return await this.ticketingService.updateTicketStatus(id, status);
  }

  @Delete(':id')
  async deleteTicket(@Param('id') id: string): Promise<DeleteResult> {
    return await this.ticketingService.deleteTicket(id);
  }

  @Post(':id/escalate')
  async escalateTicket(@Param('id') ticketId: string): Promise<Ticket> {
    return await this.ticketingService.escalateTicket(ticketId);
  }
}
