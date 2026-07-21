import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { ClientSession, UpdateQuery } from 'mongoose';
import { Ticket, TicketComment } from './entities/ticketing.entity';
import { ITicketingService } from './interfaces/ticketing.service.interface';
import { ITicketRepository } from './repository/ticket.repository';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { FindManyOptions } from 'src/libs/repository/interfaces/base-repo-options.interface';
import { TicketStatus } from './enums/ticket-status.enum';
import { OrdersStatus } from '../../features/orders/enums/orders.status.enum';
import { WalletOwnerType } from '../../features/wallets/enums/wallet-ownertype.enum';
import { Order } from '../../features/orders/entities/order.entity';
import { CachingService } from 'src/infrastructure/caching/caching.service';
import { OrdersService } from '../../features/orders/orders.service';
import { WalletsService } from '../../features/wallets/wallets.service';
import { runInTransaction } from 'src/libs/repository/run-in-transaction';
import { IOrderRepository } from '../../features/orders/repositories/order.repository';
import { getIntermediaryWalletId } from 'src/utils/intermediary-wallet.util';

@Injectable()
export class TicketingService implements ITicketingService {
  constructor(
    @Inject('TicketRepository') private readonly ticketRepository: ITicketRepository,
    private readonly cacheService: CachingService,
    @Inject('IOrdersService') private readonly ordersService: OrdersService,
    @Inject('IWalletsService') private readonly walletsService: WalletsService,
    @Inject('OrderRepository') private readonly orderRepository: IOrderRepository,
  ) { }

  /**
   * Post-dispute logic for order-related tickets.
   * L6: Added 'amount' parameter to support partial refunds.
   */
  async handleOrderAfterTicket(ticketId: string, refund: boolean, amount?: number): Promise<void> {
    const ticket = await this.findOne(ticketId);
    if (!ticket || !ticket.orderId) { return; }
    const order = await this.orderRepository.findById(ticket.orderId);
    if (!order) { return; }

    const intermediaryId = getIntermediaryWalletId();
    const totalPrice = order.totalPrice;

    await runInTransaction(this.orderRepository, async (tx) => {
      if (refund) {
        // L6: Partial Refund Logic
        if (amount && amount > 0 && amount < totalPrice) {
          // 1. Refund the partial amount to the user
          await this.walletsService.releaseBlockedAmount(
            { ownerId: intermediaryId, ownerType: WalletOwnerType.INTERMEDIARY },
            { ownerId: order.userId, ownerType: WalletOwnerType.USER },
            amount,
            { orderId: order.id.toString(), ticketId, type: 'REFUND', reason: 'partial_ticket_refund' },
            tx,
          );
          // 2. Release the remainder to the company
          await this.walletsService.releaseBlockedAmount(
            { ownerId: intermediaryId, ownerType: WalletOwnerType.INTERMEDIARY },
            { ownerId: order.companyId, ownerType: WalletOwnerType.COMPANY },
            totalPrice - amount,
            { orderId: order.id.toString(), ticketId, type: 'TRANSFER', reason: 'partial_ticket_release' },
            tx,
          );
          // 3. Mark order as COMPLETED (resolved via price adjustment)
          await this.orderRepository.updateById(order.id, { status: OrdersStatus.COMPLETED, ticketId: null }, tx);
        } else {
          // Full Refund
          await this.ordersService.refund(order.id, tx);
          await this.walletsService.releaseBlockedAmount(
            { ownerId: intermediaryId, ownerType: WalletOwnerType.INTERMEDIARY },
            { ownerId: order.userId, ownerType: WalletOwnerType.USER },
            totalPrice,
            { orderId: order.id.toString(), ticketId, type: 'REFUND', reason: 'ticket_refund' },
            tx,
          );
        }
      } else {
        // Full Release to Company
        await this.orderRepository.updateById(order.id, { status: OrdersStatus.COMPLETED, ticketId: null }, tx);
        await this.walletsService.releaseBlockedAmount(
          { ownerId: intermediaryId, ownerType: WalletOwnerType.INTERMEDIARY },
          { ownerId: order.companyId, ownerType: WalletOwnerType.COMPANY },
          totalPrice,
          { orderId: order.id.toString(), ticketId, type: 'TRANSFER', reason: 'ticket_resolution' },
          tx,
        );
      }
    });
  }

  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    // If ticket references an order, validate order ownership and timing
    let order: Order | null = null;
    if (createTicketDto.orderId) {
      order = await this.orderRepository.findById(createTicketDto.orderId);
      if (!order) { throw new NotFoundException('Order not found'); }
      // createdBy is set by controller before calling create
      if (!createTicketDto.createdBy || order.userId.toString() !== createTicketDto.createdBy) {
        throw new BadRequestException('Cannot create a ticket for an order you do not own');
      }
      if (order.status !== OrdersStatus.DELIVERED) {
        throw new BadRequestException('Order is not delivered; cannot open order-related ticket');
      }
      if (order.ticketId) {
        throw new BadRequestException('Order already has an open ticket');
      }
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const deliveredAt = order.deliveredAt as Date | undefined;
      if (!deliveredAt || deliveredAt < threeDaysAgo) {
        throw new BadRequestException('Ticket window expired for this order');
      }
    }

    // If related to an order, create ticket and set order.ticketId in a transaction
    if (createTicketDto.orderId) {
      if (!order) { throw new BadRequestException('Order not found'); }
      const orderId = order.id.toString();
      return runInTransaction(this.orderRepository, async (tx) => {
        const ticket = await this.ticketRepository.createOne(createTicketDto, tx);
        await this.orderRepository.updateById(orderId, { ticketId: ticket.id.toString() }, tx);
        if (ticket) { await this.cacheService.set(`ticket:${ticket.id}`, ticket, 3000); }
        return ticket;
      });
    }

    const ticket = await this.ticketRepository.createOne(createTicketDto);
    if (ticket) { await this.cacheService.set(`ticket:${ticket.id}`, ticket, 3000); }
    return ticket;
  }

  async findAll(options: FindManyOptions): Promise<Ticket[]> {
    return this.ticketRepository.findAll(options);
  }

  async findOne(id: string): Promise<Ticket | null> {
    const cached = await this.cacheService.get<Ticket>(`ticket:${id}`);
    if (cached) { return cached; }
    const ticket = await this.ticketRepository.findById(id);
    if (ticket) { await this.cacheService.set(`ticket:${id}`, ticket, 3000); }
    return ticket;
  }

  async findStatus(id: string): Promise<TicketStatus> {
    return this.ticketRepository.findTicketStatus(id);
  }

  async update(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket | null> {
    // Sanitize: remove keys with undefined to avoid accidental overwrites
    const sanitized: Record<string, unknown> = {};
    Object.entries(updateTicketDto || {}).forEach(([k, v]) => {
      if (v !== undefined) { sanitized[k] = v; }
    });

    const updated = await this.ticketRepository.updateById(id, sanitized as UpdateQuery<Ticket>);
    if (updated) { await this.cacheService.set(`ticket:${id}`, updated, 3000); }
    return updated;
  }

  async updateStatus(id: string, status: TicketStatus, refund?: boolean, amount?: number): Promise<Ticket | null> {
    const updated = await this.ticketRepository.updateTicketStatus(id, status);
    if (updated) { await this.cacheService.set(`ticket:${id}`, updated, 3000); }

    // if ticket is resolved/closed and related to an order, perform post-ticket order handling
    if (updated && (status === TicketStatus.Resolved || status === TicketStatus.Closed) && updated.orderId) {
      await this.resolveTicket(id, !!refund, amount);
    }

    return updated;
  }

  // strongly-typed admin/service-facing resolve method
  async resolveTicket(ticketId: string, refund: boolean, amount?: number): Promise<void> {
    // ensure status is marked resolved/closed in repository
    await this.ticketRepository.updateTicketStatus(ticketId, TicketStatus.Resolved);
    await this.handleOrderAfterTicket(ticketId, refund, amount);
  }

  async remove(id: string): Promise<boolean> {
    const removed = await this.ticketRepository.deleteById(id);
    await this.cacheService.delete(`ticket:${id}`);
    return removed;
  }

  async escalateTicket(ticketId: string): Promise<Ticket> {
    return this.ticketRepository.escalateTicket(ticketId);
  }

  async autoEscalateTickets(): Promise<void> {
    return this.ticketRepository.autoEscalateTickets();
  }

  async addComment(ticketId: string, userId: string, content: string): Promise<Ticket | null> {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Comment content cannot be empty');
    }

    const updated = await this.ticketRepository.addComment(ticketId, userId, content);
    if (updated) {
      // Update cache with new comment
      await this.cacheService.set(`ticket:${ticketId}`, updated, 3000);
    }
    return updated;
  }

  async getComments(ticketId: string): Promise<TicketComment[]> {
    const ticket = await this.findOne(ticketId);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket.comments || [];
  }
}
