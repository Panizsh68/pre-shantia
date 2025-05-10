import { DeleteResult, UpdateResult } from "mongoose";
import { Ticket } from "../entities/ticketing.entity";
import { TicketStatus } from "../enums/ticket-status.enum";
import { UpdateTicketDto } from "../dto/update-ticket.dto";
import { CreateTicketDto } from "../dto/create-ticket.dto";
import { QueryOptionsDto } from "src/utils/query-options.dto";

export interface ITicketingService {
    create(createTicketDto: CreateTicketDto): Promise<Ticket>;
    findOne(id: string): Promise<Ticket | null>;
    findAll(options: QueryOptionsDto): Promise<Ticket[]>;
    findStatus(id: string): Promise<TicketStatus>;
    update(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket | null>;
    updateStatus(id: string, status: TicketStatus): Promise<Ticket | null>;
    remove(id: string): Promise<boolean>;
    escalateTicket(ticketId: string): Promise<Ticket>;  
    autoEscalateTickets(): Promise<void>; 
}
  