import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { Ticket } from './entities/ticketing.entity';
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

@Injectable()
export class TicketingService implements ITicketingService {
  constructor(
    @Inject('TicketRepository') private readonly ticketRepository: ITicketRepository,
    private readonly cacheService: CachingService,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @Inject('IOrdersService') private readonly ordersService: OrdersService,
    @Inject('IWalletsService') private readonly walletsService: WalletsService,
  ) { }
  /**
   * Call this after ticket is resolved/closed. If refund=true, پول به کاربر برمی‌گردد و سفارش refunded می‌شود.
   * اگر refund=false، پول به شرکت منتقل و سفارش completed می‌شود.
   */
  async handleOrderAfterTicket(ticketId: string, refund: boolean): Promise<void> {
    // perform order status update and wallet transfer in a single transaction
    const ticket = await this.findOne(ticketId);
    if (!ticket || !ticket.orderId) return;
    const order = await this.orderModel.findById(ticket.orderId);
    if (!order) return;

    const session: ClientSession = await this.orderModel.db.startSession();
    session.startTransaction();
    try {
      if (refund) {
        await this.ordersService.refund(order.id, session);
        await this.walletsService.releaseBlockedAmount(
          { ownerId: 'INTERMEDIARY_ID', ownerType: WalletOwnerType.INTERMEDIARY },
          { ownerId: order.userId, ownerType: WalletOwnerType.USER },
          order.totalPrice,
          { orderId: order.id.toString(), ticketId, type: 'REFUND', reason: 'ticket_refund' },
          session,
        );
      } else {
        await this.ordersService.update({ id: order.id, status: OrdersStatus.COMPLETED, ticketId: null }, session);
        await this.walletsService.releaseBlockedAmount(
          { ownerId: 'INTERMEDIARY_ID', ownerType: WalletOwnerType.INTERMEDIARY },
          { ownerId: order.companyId, ownerType: WalletOwnerType.COMPANY },
          order.totalPrice,
          { orderId: order.id.toString(), ticketId, type: 'TRANSFER', reason: 'ticket_resolution' },
          session,
        );
      }
      await this.orderModel.updateOne({ _id: order.id }, { $set: { ticketId: null } }, { session });
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    // If ticket references an order, validate order ownership and timing
    let order: Order | null = null;
    if (createTicketDto.orderId) {
      order = await this.orderModel.findById(createTicketDto.orderId);
      if (!order) throw new NotFoundException('Order not found');
      if (!createTicketDto.createdBy || order.userId.toString() !== createTicketDto.createdBy) {
        throw new BadRequestException('Cannot create a ticket for an order you do not own');
      }
      if (order.status !== OrdersStatus.DELIVERED) {
        throw new BadRequestException('Order is not delivered; cannot open order-related ticket');
      }
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const deliveredAt = (order as any).deliveredAt as Date | undefined;
      if (!deliveredAt || deliveredAt < threeDaysAgo) {
        throw new BadRequestException('Ticket window expired for this order');
      }
    }

    // If urgent and related to an order, create ticket and set order.ticketId in a transaction
    if (createTicketDto.orderId && createTicketDto.priority === 'urgent') {
      const session = await this.orderModel.db.startSession();
      session.startTransaction();
      try {
        const ticket = await this.ticketRepository.createOne(createTicketDto, session);
        // block intermediary funds for this order in the same transaction
        if (order) {
          await this.walletsService.blockAmount(
            { ownerId: 'INTERMEDIARY_ID', ownerType: WalletOwnerType.INTERMEDIARY },
            (order as any).totalPrice,
            { orderId: order.id.toString(), ticketId: ticket.id.toString(), reason: 'urgent_ticket_hold' },
            session,
          );
        }
        await this.orderModel.updateOne({ _id: createTicketDto.orderId }, { $set: { ticketId: ticket.id } }, { session });
        if (ticket) await this.cacheService.set(`ticket:${ticket.id}`, ticket, 3000);
        await session.commitTransaction();
        session.endSession();
        return ticket;
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
      }
    }

    const ticket = await this.ticketRepository.createOne(createTicketDto);
    if (ticket) await this.cacheService.set(`ticket:${ticket.id}`, ticket, 3000);
    return ticket;
  }

  async findAll(options: FindManyOptions): Promise<Ticket[]> {
    return this.ticketRepository.findAll(options);
  }

  async findOne(id: string): Promise<Ticket | null> {
    const cached = await this.cacheService.get<Ticket>(`ticket:${id}`);
    if (cached) return cached;
    const ticket = await this.ticketRepository.findById(id);
    if (ticket) await this.cacheService.set(`ticket:${id}`, ticket, 3000);
    return ticket;
  }

  async findStatus(id: string): Promise<TicketStatus> {
    return this.ticketRepository.findTicketStatus(id);
  }

  async update(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket | null> {
    // Sanitize: remove keys with undefined to avoid accidental overwrites
    const sanitized: Partial<UpdateTicketDto> = {};
    Object.entries(updateTicketDto || {}).forEach(([k, v]) => {
      if (v !== undefined) (sanitized as any)[k] = v;
    });

    const updated = await this.ticketRepository.updateById(id, sanitized as any);
    if (updated) await this.cacheService.set(`ticket:${id}`, updated, 3000);
    return updated;
  }

  async updateStatus(id: string, status: TicketStatus, refund?: boolean): Promise<Ticket | null> {
    const updated = await this.ticketRepository.updateTicketStatus(id, status);
    if (updated) await this.cacheService.set(`ticket:${id}`, updated, 3000);

    // if ticket is resolved/closed and related to an order, perform post-ticket order handling
    if (updated && (status === TicketStatus.Resolved || status === TicketStatus.Closed) && updated.orderId) {
      await this.resolveTicket(id, !!refund);
    }

    return updated;
  }

  // strongly-typed admin/service-facing resolve method
  async resolveTicket(ticketId: string, refund: boolean): Promise<void> {
    // ensure status is marked resolved/closed in repository
    await this.ticketRepository.updateTicketStatus(ticketId, TicketStatus.Resolved);
    if (refund) {
      await this.handleOrderAfterTicket(ticketId, true);
    } else {
      await this.handleOrderAfterTicket(ticketId, false);
    }
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
}
