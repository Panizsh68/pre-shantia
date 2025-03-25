import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, Model, UpdateResult } from 'mongoose';
import { Ticket } from '../entities/ticketing.entity';
import { TicketStatus } from '../enums/ticket-status.enum';
import { UsersService } from 'src/features/users/users.service';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { ITicketingService } from '../interfaces/ticketing.service.interface';

@Injectable()
export class TicketRepository implements ITicketingService {
  constructor(@InjectModel(Ticket.name) private readonly ticketModel: Model<Ticket>) {}

  async createTicket(createTicketDto: CreateTicketDto): Promise<Ticket> {
    const ticket =  await new this.ticketModel(createTicketDto);
    return await ticket.save()
  }

  async findTicketById(id: string): Promise<Ticket> {
    const ticket =  await this.ticketModel.findById(id);
    if (!ticket) throw new NotFoundException('ticket not found ')
    return ticket
  }

  async findAllTickets(): Promise<Ticket[]> {
    const tickets = await this.ticketModel.find();
    return tickets
  }

  async findTicketStatus(id: string): Promise<TicketStatus> {
    const ticket = await this.ticketModel.findById(id)
    if (!ticket) throw new NotFoundException('ticket not found ')
    return ticket.status
  }

  async updateTicket(id: string, updateTicketDto: UpdateTicketDto): Promise<UpdateResult> {
    const ticket = await this.findTicketById(id)
    const updatedTicket = await ticket.updateOne({ _id: id}, updateTicketDto)
    return updatedTicket
  }

  async updateTicketStatus(id: string, status: TicketStatus): Promise<UpdateResult> {
    const ticket = await this.findTicketById(id)
    const updatedTicketStatus = await ticket.updateOne({ _id: id}, { status })
    return updatedTicketStatus

  }

  async deleteTicket(id: string): Promise<DeleteResult> {
    const removedTicket = await this.ticketModel.deleteOne({ _id: id})    
    return removedTicket
  }
}
