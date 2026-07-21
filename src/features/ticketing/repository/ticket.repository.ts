import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Ticket, TicketComment } from '../entities/ticketing.entity';
import { TicketStatus } from '../enums/ticket-status.enum';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TicketPriority } from '../enums/ticket-priority.enum';
import { Model, Types, ClientSession, PipelineStage } from 'mongoose';
import {
  IBaseCrudRepository,
  IBaseAggregateRepository,
  IBaseTransactionRepository,
} from 'src/libs/repository/interfaces/base-repo.interfaces';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';

export interface ITicketRepository
  extends IBaseCrudRepository<Ticket>,
    IBaseAggregateRepository<Ticket>,
    IBaseTransactionRepository<Ticket> {
  findTicketStatus(id: string): Promise<TicketStatus>;
  updateTicketStatus(id: string, status: TicketStatus): Promise<Ticket | null>;
  escalateTicket(ticketId: string): Promise<Ticket>;
  autoEscalateTickets(): Promise<void>;
  addComment(ticketId: string, userId: string, content: string, session?: ClientSession): Promise<Ticket | null>;
  getComments(ticketId: string): Promise<TicketComment[]>;
}

@Injectable()
export class TicketRepository extends BaseCrudRepository<Ticket> implements ITicketRepository {
  constructor(
    private readonly ticketModel: Model<Ticket>,
    private readonly aggregateRepository: IBaseAggregateRepository<Ticket>,
    private readonly transactionRepository: IBaseTransactionRepository<Ticket>,
  ) {
    super(ticketModel);
  }

  async findTicketStatus(id: string): Promise<TicketStatus> {
    const ticket = await this.findById(id);
    if (!ticket) {
      throw new NotFoundException(`ticket with id: ${id} not found`);
    }
    return ticket.status;
  }

  async updateTicketStatus(id: string, status: TicketStatus): Promise<Ticket> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ticket ID format');
    }

    const updatedTicket = await this.updateById(id, { status });
    return updatedTicket;
  }

  async escalateTicket(ticketId: string): Promise<Ticket> {
    const ticket = await this.findById(ticketId);

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.status !== TicketStatus.Resolved) {
      ticket.status = TicketStatus.Escalated;
      ticket.priority = TicketPriority.High;
      await ticket.save();

      return ticket;
    }

    throw new NotFoundException('Ticket already resolved');
  }

  async addComment(
    ticketId: string,
    userId: string,
    content: string,
    session?: ClientSession,
  ): Promise<Ticket | null> {
    if (!Types.ObjectId.isValid(ticketId)) {
      throw new BadRequestException('Invalid ticket ID format');
    }

    const newComment: TicketComment = {
      userId,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const query = this.ticketModel.findByIdAndUpdate(
      ticketId,
      { $push: { comments: newComment } },
      { new: true },
    );

    if (session) {
      query.session(session);
    }

    const updated = await query.exec();
    return updated;
  }

  async getComments(ticketId: string): Promise<TicketComment[]> {
    if (!Types.ObjectId.isValid(ticketId)) {
      throw new BadRequestException('Invalid ticket ID format');
    }

    const ticket = await this.ticketModel.findById(ticketId).select('comments').lean().exec();
    if (!ticket) {
      throw new NotFoundException(`Ticket with id ${ticketId} not found`);
    }
    return ticket.comments || [];
  }

  async aggregate<R = any>(pipeline: PipelineStage[], session?: ClientSession): Promise<R[]> {
    return this.aggregateRepository.aggregate<R>(pipeline, session);
  }

  async startTransaction(): Promise<ClientSession> {
    return this.transactionRepository.startTransaction();
  }

  async commitTransaction(session: ClientSession): Promise<void> {
    await this.transactionRepository.commitTransaction(session);
  }

  async abortTransaction(session: ClientSession): Promise<void> {
    await this.transactionRepository.abortTransaction(session);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async autoEscalateTickets(): Promise<void> {
    const tickets = await this.findManyByCondition({
      status: TicketStatus.Open,
      updatedAt: { $lt: new Date(Date.now() - 4 * 60 * 60 * 1000) },
    });

    for (const ticket of tickets) {
      await this.escalateTicket(ticket.id.toString());
    }
  }
}
