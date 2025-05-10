import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { TicketingService } from './ticketing.service';
import { Ticket } from './entities/ticketing.entity';
import { AuthenticationGuard } from 'src/features/users/auth/guards/auth.guard';
import { TicketStatus } from './enums/ticket-status.enum';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { QueryOptionsDto } from 'src/utils/query-options.dto';

@Controller('tickets')
@UseGuards(AuthenticationGuard)
export class TicketingController {
  constructor(private readonly ticketingService: TicketingService) {}

  @Post()
  async create(@Body() createTicketDto: CreateTicketDto): Promise<Ticket> {
    return await this.ticketingService.create(createTicketDto);
  }

  @Get()
  async findAll(@Body() options: QueryOptionsDto): Promise<Ticket[]> {
    return await this.ticketingService.findAll(options);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Ticket | null> {
    return await this.ticketingService.findOne(id);
  }

  @Get(':id/status')
  async findStatus(@Param('id') id: string): Promise<TicketStatus> {
    return await this.ticketingService.findStatus(id)
  }
  
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto)
  : Promise<Ticket | null> {
    return await this.ticketingService.update(id, updateTicketDto);
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: TicketStatus)
  : Promise<Ticket | null> {
    return await this.ticketingService.updateStatus(id, status);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<boolean> {
    return await this.ticketingService.remove(id);
  }

  @Post(':id/escalate')
  async escalateTicket(@Param('id') ticketId: string): Promise<Ticket> {
    return await this.ticketingService.escalateTicket(ticketId);
  }
}
