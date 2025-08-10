import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrderRepository } from './repositories/order.repository';
import { IOrdersService } from './interfaces/order.service.interface';
import { UpdateOrderDto } from './dto/update-order.dto';
import { IOrder } from './interfaces/order.interface';
import { Types, ClientSession } from 'mongoose';
import { OrdersStatus } from './enums/orders.status.enum';
import { WalletOwnerType } from '../wallets/enums/wallet-ownertype.enum';
import { Order } from './entities/order.entity';
import { IWalletService } from '../wallets/interfaces/wallet.service.interface';
import { OrderFactoryService } from './order-factory.service';
import { ICartsService } from '../carts/interfaces/carts-service.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { CartItemDto } from '../carts/dto/cart-item.dto';

@Injectable()
export class OrdersService implements IOrdersService {
  constructor(
    @Inject('ICartsService') private readonly cartsService: ICartsService,
    @Inject('IWalletsService') private readonly walletsService: IWalletService,
    @Inject('OrderRepository') private readonly orderRepository: IOrderRepository,
    private readonly orderFactory: OrderFactoryService,
  ) {}

  async create(dto: CreateOrderDto, session?: ClientSession): Promise<IOrder[]> {
    const cart = await this.cartsService.getUserActiveCart(dto.userId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Empty cart');
    }

    const orderSession = session || (await this.orderRepository.startTransaction());

    try {
      const orderDtos = this.orderFactory.buildOrdersFromCart(cart).map(order => ({
        ...order,
        shippingAddress: dto.shippingAddress,
        paymentMethod: dto.paymentMethod,
      }));

      const orders: IOrder[] = [];

      for (const orderDto of orderDtos) {
        const cartItemsForOrder: CartItemDto[] = orderDto.items.map(orderItem => {
          const cartItem = cart.items.find(
            ci => ci.productId.toString() === orderItem.productId.toString(),
          );
          if (!cartItem) {
            throw new BadRequestException(`Product ${orderItem.productId} not found in cart`);
          }
          return {
            ...cartItem,
            quantity: orderItem.quantity,
          };
        });

        const calculatedTotal = this.cartsService.calculateTotal(cartItemsForOrder);

        const validatedDto = {
          ...orderDto,
          totalPrice: calculatedTotal,
          status: OrdersStatus.PENDING,
        };

        const createdOrder = await this.orderRepository.createOne(validatedDto, orderSession);
        orders.push(createdOrder);
      }

      await this.cartsService.checkout(dto.userId);
      if (!session) await this.orderRepository.commitTransaction(orderSession);

      return orders;
    } catch (err) {
      if (!session) await this.orderRepository.abortTransaction(orderSession);
      throw err;
    }
  }

  async findById(id: string, session?: ClientSession): Promise<Order> {
    const order = await this.orderRepository.findById(id, { session });
    if (!order) {
      throw new NotFoundException(`Order with ID '${id}' not found`);
    }
    return order;
  }

  async find(
    filter: { where: Record<string, unknown> },
    session?: ClientSession,
  ): Promise<Order[]> {
    const orders = await this.orderRepository.findManyByCondition(filter.where, { session });
    return orders;
  }

  async findByUserId(userId: string): Promise<Order[]> {
    const orders = await this.orderRepository.findByUserId(userId);
    return orders;
  }

  async findByCompanyId(companyId: string): Promise<Order[]> {
    const orders = await this.orderRepository.findByCompanyId(companyId);
    return orders;
  }

  async findActiveOrdersByUserId(userId: string): Promise<Order[]> {
    const orders = await this.orderRepository.findActiveOrdersByUserId(userId);
    return orders;
  }

  async update(dto: UpdateOrderDto, session?: ClientSession): Promise<Order> {
    const orderSession = session || (await this.orderRepository.startTransaction());
    try {
      const updateData = {
        userId: dto.userId,
        items: dto.items?.map(item => ({
          productId: item.productId ? new Types.ObjectId(item.productId) : undefined,
          quantity: item.quantity,
        })),
        totalPrice: dto.totalPrice,
        status: dto.status,
        shippingAddress: dto.shippingAddress,
        paymentMethod: dto.paymentMethod,
        companyId: dto.companyId ? new Types.ObjectId(dto.companyId) : undefined,
        transportId: dto.transportId ? new Types.ObjectId(dto.transportId) : undefined,
      };

      const updatedOrder = await this.orderRepository.updateById(dto.id, updateData, orderSession);
      if (!updatedOrder) {
        throw new NotFoundException(`Order with ID '${dto.id}' not found`);
      }
      if (!session) {
        await this.orderRepository.commitTransaction(orderSession);
      }
      return updatedOrder;
    } catch (error) {
      if (!session) {
        await this.orderRepository.abortTransaction(orderSession);
      }
      throw new BadRequestException(`Failed to update order: ${error.message}`);
    }
  }

  async markAsPaid(id: string, session?: ClientSession): Promise<Order> {
    const orderSession = session || (await this.orderRepository.startTransaction());
    try {
      const order = await this.orderRepository.findById(id, { session: orderSession });
      if (!order) {
        throw new NotFoundException(`Order with ID '${id}' not found`);
      }
      if (order.status !== OrdersStatus.PENDING) {
        throw new BadRequestException(
          `Order with ID '${id}' cannot be marked as paid from status '${order.status}'`,
        );
      }

      const updateData = { status: OrdersStatus.PAID };
      const updatedOrder = await this.orderRepository.updateById(id, updateData, orderSession);
      if (!session) {
        await this.orderRepository.commitTransaction(orderSession);
      }
      return updatedOrder;
    } catch (error) {
      if (!session) {
        await this.orderRepository.abortTransaction(orderSession);
      }
      throw new BadRequestException(`Failed to mark order as paid: ${error.message}`);
    }
  }

  async markAsShipped(id: string, transportId?: string, session?: ClientSession): Promise<Order> {
    if (transportId && !Types.ObjectId.isValid(transportId)) {
      throw new BadRequestException(`Invalid transport ID format: ${transportId}`);
    }
    const orderSession = session || (await this.orderRepository.startTransaction());
    try {
      const order = await this.orderRepository.findById(id, { session: orderSession });
      if (!order) {
        throw new NotFoundException(`Order with ID '${id}' not found`);
      }
      if (order.status !== OrdersStatus.PAID) {
        throw new BadRequestException(
          `Order with ID '${id}' cannot be marked as shipped from status '${order.status}'`,
        );
      }

      const updateData: Partial<Order> = { status: OrdersStatus.SHIPPED };
      if (transportId) {
        updateData.transportId = transportId;
      }
      const updatedOrder = await this.orderRepository.updateById(id, updateData, orderSession);
      if (!session) {
        await this.orderRepository.commitTransaction(orderSession);
      }
      return updatedOrder;
    } catch (error) {
      if (!session) {
        await this.orderRepository.abortTransaction(orderSession);
      }
      throw new BadRequestException(`Failed to mark order as shipped: ${error.message}`);
    }
  }

  async markAsDelivered(id: string, session?: ClientSession): Promise<Order> {
    const orderSession = session || (await this.orderRepository.startTransaction());
    try {
      const order = await this.orderRepository.findById(id, { session: orderSession });
      if (!order) {
        throw new NotFoundException(`Order with ID '${id}' not found`);
      }
      if (order.status !== OrdersStatus.SHIPPED) {
        throw new BadRequestException(
          `Order with ID '${id}' cannot be marked as delivered from status '${order.status}'`,
        );
      }

      const updateData = { status: OrdersStatus.DELIVERED, deliveredAt: new Date() };
      const updatedOrder = await this.orderRepository.updateById(id, updateData, orderSession);
      if (!session) {
        await this.orderRepository.commitTransaction(orderSession);
      }
      return updatedOrder;
    } catch (error) {
      if (!session) {
        await this.orderRepository.abortTransaction(orderSession);
      }
      throw new BadRequestException(`Failed to mark order as delivered: ${error.message}`);
    }
  }

  async refund(id: string, session?: ClientSession): Promise<IOrder> {
    const orderSession = session || (await this.orderRepository.startTransaction());
    try {
      const order = await this.orderRepository.findById(id, { session: orderSession });
      if (!order) {
        throw new NotFoundException(`Order with ID '${id}' not found`);
      }
      if (![OrdersStatus.PAID, OrdersStatus.SHIPPED].includes(order.status)) {
        throw new BadRequestException(
          `Order with ID '${id}' cannot be refunded from status '${order.status}'`,
        );
      }

      const updateData = { status: OrdersStatus.REFUNDED };
      const updatedOrder = await this.orderRepository.updateById(id, updateData, orderSession);
      if (!session) {
        await this.orderRepository.commitTransaction(orderSession);
      }
      return updatedOrder;
    } catch (error) {
      if (!session) {
        await this.orderRepository.abortTransaction(orderSession);
      }
      throw new BadRequestException(`Failed to refund order: ${error.message}`);
    }
  }

  async confirmDelivery(orderId: string, userId: string, session?: ClientSession): Promise<IOrder> {
    const orderSession = session || (await this.orderRepository.startTransaction());
    try {
      const order = await this.orderRepository.findById(orderId, { session: orderSession });
      if (!order) {
        throw new NotFoundException(`Order with ID '${orderId}' not found`);
      }
      if (order.userId.toString() !== userId) {
        throw new BadRequestException('Unauthorized');
      }
      if (order.status !== OrdersStatus.DELIVERED) {
        throw new BadRequestException('Order is not delivered');
      }

      const updateData = { status: OrdersStatus.COMPLETED, confirmedAt: new Date() };
      const updatedOrder = await this.orderRepository.updateById(orderId, updateData, orderSession);

      await this.walletsService.transfer(
        { ownerId: 'INTERMEDIARY_ID', ownerType: WalletOwnerType.INTERMEDIARY },
        { ownerId: order.companyId.toString(), ownerType: WalletOwnerType.COMPANY },
        order.totalPrice,
        orderSession,
      );

      if (!session) {
        await this.orderRepository.commitTransaction(orderSession);
      }
      return updatedOrder;
    } catch (error) {
      if (!session) {
        await this.orderRepository.abortTransaction(orderSession);
      }
      throw new BadRequestException(`Failed to confirm delivery: ${error.message}`);
    }
  }
}
