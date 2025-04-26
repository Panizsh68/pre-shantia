import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, Model, UpdateResult } from 'mongoose';
import { Ticket } from '../entities/ticketing.entity';
import { TicketStatus } from '../enums/ticket-status.enum';
import { UsersService } from 'src/features/users/users.service';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { ITicketingService } from '../interfaces/ticketing.service.interface';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TicketPriority } from '../enums/ticket-priority.enum';
import { BaseRepository, IBaseRepository } from 'src/utils/base.repository';


export interface ITicketRepository extends IBaseRepository<Ticket> {
  findTicketStatus(id: string): Promise<TicketStatus>;
  updateTicketStatus(id: string, status: TicketStatus): Promise<Ticket | null>;
  escalateTicket(ticketId: string): Promise<Ticket>;
  autoEscalateTickets();
}



@Injectable()
export class TicketRepository extends BaseRepository<Ticket> implements ITicketRepository {
  constructor(private readonly ticketModel: Model<Ticket>) {
        super(ticketModel)
  }

  async findTicketStatus(id: string): Promise<TicketStatus> {
    const ticket = await this.findById(id)
    if (!ticket) throw new NotFoundException('ticket not found ')
    return ticket.status
  }

  async updateTicketStatus(id: string, status: TicketStatus): Promise<Ticket | null> {
    const ticket = await this.ticketModel.findById(id)
    const updatedTicketStatus = await ticket?.updateOne({ _id: id}, { status })
    return updatedTicketStatus

  }

  // Method to escalate a ticket
  async escalateTicket(ticketId: string): Promise<Ticket> {
    const ticket = await this.ticketModel.findById(ticketId);
    
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    if (ticket.status !== TicketStatus.Resolved) {
      // Update ticket to escalated status
      ticket.status = TicketStatus.Escalated;
      ticket.priority = TicketPriority.High;
      await ticket.save();
      
      // Here you could also notify the user or the agent, e.g., with a WebSocket event
      return ticket;
    }

    throw new Error('Ticket already resolved');
  }


  // Cron job to automatically escalate tickets after 4 hours if no response
  @Cron(CronExpression.EVERY_HOUR) // Runs every hour
  async autoEscalateTickets() {
    const tickets = await this.ticketModel.find({
      status: TicketStatus.Open,
      updatedAt: { $lt: new Date(Date.now() - 4 * 60 * 60 * 1000) }, // 4 hours threshold
    });

    for (const ticket of tickets) {
      await this.escalateTicket(ticket.id.toString());
    }
  }
}
