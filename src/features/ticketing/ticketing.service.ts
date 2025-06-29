import { Inject, Injectable } from '@nestjs/common';
import { CachingService } from 'src/infrastructure/caching/caching.service';
import { ITicketRepository } from './repository/ticket.repository';
import { Ticket } from './entities/ticketing.entity';
import { TicketStatus } from './enums/ticket-status.enum';
import { ITicketingService } from './interfaces/ticketing.service.interface';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { FindManyOptions } from 'src/libs/repository/interfaces/base-repo-options.interface';

@Injectable()
export class TicketingService implements ITicketingService {
  constructor(
    @Inject('TicketRepository') private readonly ticketRepository: ITicketRepository,
    private readonly cacheService: CachingService,
  ) {}

  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    const ticket = await this.ticketRepository.createOne(createTicketDto);
    await this.cacheService.set(`ticket:${ticket.id}`, ticket, 3000);
    return ticket;
  }

  async findAll(options: FindManyOptions): Promise<Ticket[]> {
    const tickets = await this.ticketRepository.findAll(options);
    return tickets;
  }

  async findOne(id: string): Promise<Ticket | null> {
    const cachedTicket = await this.cacheService.get<Ticket>(`ticket:${id}`);
    if (cachedTicket) {
      return cachedTicket;
    }
    const ticket = await this.ticketRepository.findById(id);
    if (ticket) {
      await this.cacheService.set(`ticket:${id}`, ticket, 3000);
    }
    return ticket;
  }

  async findStatus(id: string): Promise<TicketStatus> {
    const status = await this.ticketRepository.findTicketStatus(id);
    return status;
  }

  async update(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket | null> {
    const updatedTicket = await this.ticketRepository.updateById(id, updateTicketDto);
    if (updatedTicket) {
      await this.cacheService.set(`ticket:${id}`, updatedTicket, 3000);
    }
    return updatedTicket;
  }

  async updateStatus(id: string, status: TicketStatus): Promise<Ticket | null> {
    const updatedTicket = await this.ticketRepository.updateTicketStatus(id, status);
    if (updatedTicket) {
      await this.cacheService.set(`ticket:${id}`, updatedTicket, 3000);
    }
    return updatedTicket;
  }

  async remove(id: string): Promise<boolean> {
    const removedTicket = await this.ticketRepository.deleteById(id);
    await this.cacheService.delete(`ticket:${id}`);
    return removedTicket;
  }

  // Method to escalate a ticket
  async escalateTicket(ticketId: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.escalateTicket(ticketId);
    return ticket;
  }

  async autoEscalateTickets(): Promise<void> {
    return this.ticketRepository.autoEscalateTickets();
  }
}
