import { DeleteResult, UpdateResult } from "mongoose";
import { Ticket } from "../entities/ticketing.entity";
import { TicketStatus } from "../enums/ticket-status.enum";
import { UpdateTicketDto } from "../dto/update-ticket.dto";
import { CreateTicketDto } from "../dto/create-ticket.dto";

export interface ITicketingService {
    create(createTicketDto: CreateTicketDto): Promise<Ticket>;
    findById(id: string): Promise<Ticket | null>;
    findAll(): Promise<Ticket[]>;
    findStatus(id: string): Promise<TicketStatus>;
    update(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket | null>;
    updateStatus(id: string, status: TicketStatus): Promise<Ticket | null>;
    remove(id: string): Promise<boolean>;
    escalateTicket(ticketId: string): Promise<Ticket>;  
    autoEscalateTickets(): Promise<void>; 
}
  