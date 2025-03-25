import { Injectable } from '@nestjs/common';
import { CachingService } from 'src/infrastructure/caching/caching.service';
import { TicketRepository } from './repository/ticket.repository';
import { Ticket } from './entities/ticketing.entity';
import { TicketStatus } from './enums/ticket-status.enum';
import { ITicketingService } from './interfaces/ticketing.service.interface';
import { DeleteResult, UpdateResult } from 'mongoose';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Injectable()
export class TicketingService implements ITicketingService{
  constructor(
    private readonly ticketRepo: TicketRepository,
    private readonly cacheService: CachingService,
  ) {}

  async createTicket(createTicketDto: CreateTicketDto): Promise<Ticket> {
    const ticket = await this.ticketRepo.createTicket(createTicketDto);
    await this.cacheService.set(`ticket:${ticket.id}`, ticket, 3000);
    return ticket;
  }

  async findAllTickets(): Promise<Ticket[]> {
    return await this.ticketRepo.findAllTickets();
  }

  async findTicketById(id: string): Promise<Ticket> {
    const cachedTicket = await this.cacheService.get<Ticket>(`ticket:${id}`);
    if (cachedTicket) return cachedTicket;
    const ticket = await this.ticketRepo.findTicketById(id);
    if (ticket) await this.cacheService.set(`ticket:${id}`, ticket, 3000)
    return ticket;
  }

  async findTicketStatus(id: string): Promise<TicketStatus> {
    return await this.ticketRepo.findTicketStatus(id)
  }

  async updateTicket(id: string, updateTicketDto: UpdateTicketDto): Promise<UpdateResult> {
    const updatedTicket = await this.ticketRepo.updateTicket(id, updateTicketDto);
    if (updatedTicket) await this.cacheService.set(`ticket:${id}`, updatedTicket, 3000);
    return updatedTicket;
  }

  
  async updateTicketStatus(id: string, status: TicketStatus): Promise<UpdateResult> {
    const updatedTicket = await this.ticketRepo.updateTicketStatus(id, status);
    if (updatedTicket) await this.cacheService.set(`ticket:${id}`, updatedTicket, 3000);
    return updatedTicket;
  }

  async deleteTicket(id: string): Promise<DeleteResult> {
    const removedTicket = await this.ticketRepo.deleteTicket(id);
    await this.cacheService.delete(`ticket:${id}`);
    return removedTicket
  }

}
