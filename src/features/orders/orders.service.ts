import { BadRequestException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { IOrderRepository } from './repositories/order.repository';
import { IOrdersService } from './interfaces/order.service.interface';
import { UpdateOrderDto } from './dto/update-order.dto';
import { IOrder } from './interfaces/order.interface';
import { Types, ClientSession } from 'mongoose';
import { runInTransaction } from 'src/libs/repository/run-in-transaction';
import { OrdersStatus } from './enums/orders.status.enum';
import { WalletOwnerType } from '../wallets/enums/wallet-ownertype.enum';
import { Order } from './entities/order.entity';
import { IWalletService } from '../wallets/interfaces/wallet.service.interface';
import { IProductService } from '../products/interfaces/product.service.interface';
import { IProductRepository } from '../products/repositories/product.repository';
import { OrderFactoryService } from './order-factory.service';
import { ICartsService } from '../carts/interfaces/carts-service.interface';
import { CreateOrderFromCartDto } from './dto/create-order-from-cart.dto';
import { CartItemDto } from '../carts/dto/cart-item.dto';
import { getIntermediaryWalletId } from 'src/utils/intermediary-wallet.util';

@Injectable()
export class OrdersService implements IOrdersService {
  constructor(
    @Inject(forwardRef(() => 'ICartsService')) private readonly cartsService: ICartsService,
    @Inject('IWalletsService') private readonly walletsService: IWalletService,
    @Inject('OrderRepository') private readonly orderRepository: IOrderRepository,
    @Inject('IProductsService') private readonly productsService: IProductService,
    @Inject('ProductRepository') private readonly productRepository: IProductRepository,
    private readonly orderFactory: OrderFactoryService,
  ) { }

  async create(dto: CreateOrderFromCartDto, session?: ClientSession): Promise<IOrder[]> {
    return runInTransaction(this.orderRepository, async (orderSession) => {
      // 1. Load active cart
      const cart = await this.cartsService.getUserActiveCart(dto.userId, orderSession);
      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Empty cart');
      }

      // 2. Build order DTOs grouped by company
      let orderDtos = this.orderFactory.buildOrdersFromCart(cart);
      if (dto.perCompany && typeof dto.perCompany === 'object') {
        if (Array.isArray(dto.perCompany)) {
          orderDtos = orderDtos.map(order => {
            const overrides = (dto.perCompany as Array<{ companyId: string }>).find((o) => o.companyId === order.companyId);
            return { ...order, ...(overrides ?? {}) };
          });
        } else {
          orderDtos = orderDtos.map(order => {
            const rawOverride = (dto.perCompany as Record<string, unknown>)[order.companyId];
            const overrides = typeof rawOverride === 'object' && rawOverride !== null ? rawOverride as Record<string, unknown> : {};
            return { ...order, ...overrides };
          });
        }
      } else {
        orderDtos = orderDtos.map(order => ({
          ...order,
          shippingAddress: dto.shippingAddress,
          paymentMethod: dto.paymentMethod,
        }));
      }

      // 3. Validate product prices and prep stock reservation
      const productIdStrs = Array.from(new Set(cart.items.map(i => String(i.productId))));
      const productIds = productIdStrs.map(id => new Types.ObjectId(id));
      
      const products = await this.productRepository.findManyByCondition(
        { _id: { $in: productIds } }, 
        { session: orderSession }
      );
      
      const productMap = new Map<string, any>();
      for (const p of products) { productMap.set(p.id, p); }

      const reservationItems: { productId: Types.ObjectId; qty: number }[] = [];
      
      for (const item of cart.items) {
        const product = productMap.get(String(item.productId));
        if (!product) throw new BadRequestException(`Product ${item.productId} not found`);
        
        // Verify price hasn't changed since adding to cart
        const currentPrice = Math.round(this.computeFinalPrice(product, item.variant));
        if (item.priceAtAdd && Math.abs(item.priceAtAdd - currentPrice) > 0) {
          throw new BadRequestException(
            `Price changed for product ${product.name}. Cart price: ${item.priceAtAdd}, current price: ${currentPrice}. Please refresh your cart.`,
          );
        }
        
        reservationItems.push({
          productId: new Types.ObjectId(item.productId),
          qty: Number(item.quantity || 0),
        });
      }

      // 4. ATOMIC STOCK RESERVATION
      const modifiedCount = await this.productRepository.bulkDecrementStock(reservationItems, orderSession);
      if (modifiedCount !== reservationItems.length) {
        throw new BadRequestException('One or more items in your cart are no longer available in the requested quantity.');
      }

      // 5. Build and Save Orders
      const orders: IOrder[] = [];
      for (const orderDto of orderDtos) {
        const items = orderDto.items.map((item: any) => {
          const product = productMap.get(String(item.productId));
          return {
            ...item,
            priceAtAdd: Math.round(this.computeFinalPrice(product, item.variant)),
          };
        });
        const totalPrice = items.reduce((sum, it) => sum + (Number(it.priceAtAdd) * Number(it.quantity)), 0);
        
        const order = await this.orderRepository.create({
          ...orderDto,
          items,
          totalPrice,
        } as Order, orderSession);
        orders.push(order);
      }

      // 6. Checkout cart
      await this.cartsService.checkout(dto.userId, orderSession);
      return orders;
    }, session);
  }

  private computeFinalPrice(product: any, selectedVariant?: { name: string; value: string }) {
    let price = product.basePrice || 0;
    const discount = Math.min(Math.max(product.discount || 0, 0), 100);
    const discountAmount = (price * discount) / 100;
    price = Math.max(price - discountAmount, 0);
    if (selectedVariant && product.variants?.length) {
      const variant = product.variants.find((v) => v.name === selectedVariant.name);
      if (variant) {
        const option = variant.options.find((o) => o.value === selectedVariant.value);
        if (option && typeof option.priceModifier === 'number') {
          price += option.priceModifier;
        }
      }
    }
    return price;
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
    return runInTransaction(this.orderRepository, async (orderSession) => {
      const items: any[] = [];
      if (dto.items && Array.isArray(dto.items)) {
        for (const item of dto.items) {
          if (!item.productId || !Types.ObjectId.isValid(item.productId)) {
            throw new BadRequestException(`Invalid productId: ${item.productId}`);
          }
          const product = await this.productRepository.findById(item.productId, { session: orderSession });
          if (!product) {
            throw new NotFoundException(`Product ${item.productId} not found`);
          }
          if (String(product.companyId) !== String(item.companyId)) {
            throw new BadRequestException(`Product ${item.productId} does not belong to company ${item.companyId}`);
          }
          if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
            throw new BadRequestException(`Invalid quantity ${item.quantity} for product ${item.productId}`);
          }
          items.push({
            productId: item.productId,
            companyId: item.companyId,
            quantity: item.quantity,
            priceAtAdd: item.priceAtAdd,
            variant: item.variant,
          });
        }
      }
      const updateData = {
        userId: dto.userId,
        items,
        totalPrice: dto.totalPrice,
        status: dto.status,
        shippingAddress: dto.shippingAddress,
        paymentMethod: dto.paymentMethod,
        companyId: dto.companyId ?? '',
        transportId: dto.transportId ?? '',
      };

      const updatedOrder = await this.orderRepository.updateById(dto.id, updateData, orderSession);
      if (!updatedOrder) {
        throw new NotFoundException(`Order with ID '${dto.id}' not found`);
      }
      return updatedOrder;
    }, session);
  }

  async markAsPaid(id: string, session?: ClientSession): Promise<Order> {
    return runInTransaction(this.orderRepository, async (orderSession) => {
      const order = await this.orderRepository.findById(id, { session: orderSession });
      if (!order) {
        throw new NotFoundException(`Order with ID '${id}' not found`);
      }
      if (order.status !== OrdersStatus.PENDING) {
        throw new BadRequestException(
          `Order with ID '${id}' cannot be marked as paid from status '${order.status}'`,
        );
      }

      const updatedOrder = await this.orderRepository.updateById(id, { status: OrdersStatus.PAID }, orderSession);
      return updatedOrder;
    }, session);
  }

  async markAsShipped(id: string, transportId?: string, session?: ClientSession): Promise<Order> {
    if (transportId && !Types.ObjectId.isValid(transportId)) {
      throw new BadRequestException(`Invalid transport ID format: ${transportId}`);
    }
    return runInTransaction(this.orderRepository, async (orderSession) => {
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
      return updatedOrder;
    }, session);
  }

  async markAsDelivered(id: string, session?: ClientSession): Promise<Order> {
    return runInTransaction(this.orderRepository, async (orderSession) => {
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
      return updatedOrder;
    }, session);
  }

  async refund(id: string, session?: ClientSession): Promise<IOrder> {
    return runInTransaction(this.orderRepository, async (orderSession) => {
      const order = await this.orderRepository.findById(id, { session: orderSession });
      if (!order) {
        throw new NotFoundException(`Order with ID '${id}' not found`);
      }
      if (![OrdersStatus.PAID, OrdersStatus.SHIPPED].includes(order.status)) {
        throw new BadRequestException(
          `Order with ID '${id}' cannot be refunded from status '${order.status}'`,
        );
      }

      const updatedOrder = await this.orderRepository.updateById(id, { status: OrdersStatus.REFUNDED }, orderSession);
      return updatedOrder;
    }, session);
  }

  async confirmDelivery(orderId: string, userId: string, session?: ClientSession): Promise<IOrder> {
    return runInTransaction(this.orderRepository, async (orderSession) => {
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
      if (order.ticketId) {
        throw new BadRequestException('Order has an open ticket and cannot be confirmed');
      }

      const updateData = { status: OrdersStatus.COMPLETED, confirmedAt: new Date() };
      const updatedOrder = await this.orderRepository.updateById(orderId, updateData, orderSession);

      const intermediaryId = getIntermediaryWalletId();
      // Use shared correlationId with Cron to ensure idempotency (Fixes B3)
      const correlationId = `release-order-${orderId}`;

      await this.walletsService.releaseBlockedAmount(
        { ownerId: intermediaryId, ownerType: WalletOwnerType.INTERMEDIARY },
        { ownerId: order.companyId.toString(), ownerType: WalletOwnerType.COMPANY },
        order.totalPrice,
        { 
          orderId: order.id.toString(), 
          type: 'TRANSFER', 
          reason: 'delivery_confirmed',
          correlationId
        },
        orderSession,
      );

      return updatedOrder;
    }, session);
  }
}
