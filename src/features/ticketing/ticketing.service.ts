import { Inject, Injectable } from '@nestjs/common';
import { CachingService } from 'src/infrastructure/caching/caching.service';
import { ITicketRepository, TicketRepository } from './repository/ticket.repository';
import { Ticket } from './entities/ticketing.entity';
import { TicketStatus } from './enums/ticket-status.enum';
import { ITicketingService } from './interfaces/ticketing.service.interface';
import { DeleteResult, UpdateResult } from 'mongoose';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';


@Injectable()
export class TicketingService implements ITicketingService{
  constructor(
    @Inject('TicketRepository') private readonly ticketRepository: ITicketRepository,
    private readonly cacheService: CachingService,
  ) {}

  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    const ticket = await this.ticketRepository.create(createTicketDto);
    await this.cacheService.set(`ticket:${ticket.id}`, ticket, 3000);
    return ticket;
  }

  async findAll(): Promise<Ticket[]> {
    return await this.ticketRepository.findAll();
  }

  async findById(id: string): Promise<Ticket | null> {
    const cachedTicket = await this.cacheService.get<Ticket>(`ticket:${id}`);
    if (cachedTicket) return cachedTicket;
    const ticket = await this.ticketRepository.findById(id);
    if (ticket) await this.cacheService.set(`ticket:${id}`, ticket, 3000)
    return ticket;
  }

  async findStatus(id: string): Promise<TicketStatus> {
    return await this.ticketRepository.findTicketStatus(id)
  }

  async update(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket | null> {
    const updatedTicket = await this.ticketRepository.update(id, updateTicketDto);
    if (updatedTicket) await this.cacheService.set(`ticket:${id}`, updatedTicket, 3000);
    return updatedTicket;
  }

  
  async updateStatus(id: string, status: TicketStatus): Promise<Ticket | null> {
    const updatedTicket = await this.ticketRepository.updateTicketStatus(id, status);
    if (updatedTicket) await this.cacheService.set(`ticket:${id}`, updatedTicket, 3000);
    return updatedTicket;
  }

  async remove(id: string): Promise<boolean> {
    const removedTicket = await this.ticketRepository.delete(id);
    await this.cacheService.delete(`ticket:${id}`);
    return removedTicket
  }

  // Method to escalate a ticket
  async escalateTicket(ticketId: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.escalateTicket(ticketId);
    return  ticket;
  }

  async autoEscalateTickets() {
    return this.ticketRepository.autoEscalateTickets()
  }
}
