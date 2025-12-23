import { Ticket, TicketComment } from '../entities/ticketing.entity';
import { TicketStatus } from '../enums/ticket-status.enum';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { FindManyOptions } from 'src/libs/repository/interfaces/base-repo-options.interface';

export interface ITicketingService {
  create(createTicketDto: CreateTicketDto): Promise<Ticket>;
  findOne(id: string): Promise<Ticket | null>;
  findAll(options: FindManyOptions): Promise<Ticket[]>;
  findStatus(id: string): Promise<TicketStatus>;
  update(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket | null>;
  updateStatus(id: string, status: TicketStatus, refund?: boolean): Promise<Ticket | null>;
  resolveTicket(ticketId: string, refund: boolean): Promise<void>;
  remove(id: string): Promise<boolean>;
  escalateTicket(ticketId: string): Promise<Ticket>;
  autoEscalateTickets(): Promise<void>;
  addComment(ticketId: string, userId: string, content: string): Promise<Ticket | null>;
  getComments(ticketId: string): Promise<TicketComment[]>;
}
