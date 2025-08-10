import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
    const ticket = await this.findOne(ticketId);
    if (!ticket || !ticket.orderId) return;
    const order = await this.orderModel.findById(ticket.orderId);
    if (!order) return;

    if (refund) {
      await this.ordersService.refund(order.id);
      await this.walletsService.transfer(
        { ownerId: 'INTERMEDIARY_ID', ownerType: WalletOwnerType.INTERMEDIARY },
        { ownerId: order.userId, ownerType: WalletOwnerType.USER },
        order.totalPrice,
      );
    } else {
      await this.ordersService.update({ id: order.id, status: OrdersStatus.COMPLETED, ticketId: null });
      await this.walletsService.transfer(
        { ownerId: 'INTERMEDIARY_ID', ownerType: WalletOwnerType.INTERMEDIARY },
        { ownerId: order.companyId, ownerType: WalletOwnerType.COMPANY },
        order.totalPrice,
      );
    }
    await this.orderModel.updateOne({ _id: order.id }, { $set: { ticketId: null } });
  }

  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    const ticket = await this.ticketRepository.createOne(createTicketDto);
    await this.cacheService.set(`ticket:${ticket.id}`, ticket, 3000);
    if (createTicketDto['orderId'] && createTicketDto.priority === 'urgent') {
      await this.orderModel.updateOne(
        { _id: createTicketDto['orderId'] },
        { $set: { ticketId: ticket.id } },
      );
    }
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
    const updated = await this.ticketRepository.updateById(id, updateTicketDto);
    if (updated) await this.cacheService.set(`ticket:${id}`, updated, 3000);
    return updated;
  }

  async updateStatus(id: string, status: TicketStatus): Promise<Ticket | null> {
    const updated = await this.ticketRepository.updateTicketStatus(id, status);
    if (updated) await this.cacheService.set(`ticket:${id}`, updated, 3000);
    return updated;
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
