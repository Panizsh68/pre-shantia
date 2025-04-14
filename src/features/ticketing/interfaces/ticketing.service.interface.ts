import { DeleteResult, UpdateResult } from "mongoose";
import { Ticket } from "../entities/ticketing.entity";
import { TicketStatus } from "../enums/ticket-status.enum";
import { UpdateTicketDto } from "../dto/update-ticket.dto";
import { CreateTicketDto } from "../dto/create-ticket.dto";

export interface ITicketingService {
    createTicket(createTicketDto: CreateTicketDto): Promise<Ticket>;
    findTicketById(id: string): Promise<Ticket>;
    findAllTickets(): Promise<Ticket[]>;
    findTicketStatus(id: string): Promise<TicketStatus>;
    updateTicket(id: string, updateTicketDto: UpdateTicketDto): Promise<UpdateResult>;
    updateTicketStatus(id: string, status: TicketStatus): Promise<UpdateResult>;
    deleteTicket(id: string): Promise<DeleteResult>;
    escalateTicket(ticketId: string): Promise<Ticket>;  
    autoEscalateTickets(): Promise<void>; 
}
  