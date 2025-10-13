import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class OrdersService implements IOrdersService {
  constructor(
    @Inject('ICartsService') private readonly cartsService: ICartsService,
    @Inject('IWalletsService') private readonly walletsService: IWalletService,
    @Inject('OrderRepository') private readonly orderRepository: IOrderRepository,
    @Inject('IProductsService') private readonly productsService: IProductService,
    @Inject('ProductRepository') private readonly productRepository: IProductRepository,
    private readonly orderFactory: OrderFactoryService,
  ) { }

  async create(dto: CreateOrderFromCartDto, session?: ClientSession): Promise<IOrder[]> {
    return runInTransaction(this.orderRepository, async (orderSession) => {
      // خواندن سبد داخل تراکنش
      const cart = await this.cartsService.getUserActiveCart(dto.userId, orderSession);
      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Empty cart');
      }

      // ساخت orderDtos با perCompany overrides
      let orderDtos = this.orderFactory.buildOrdersFromCart(cart);
      if (dto.perCompany && typeof dto.perCompany === 'object') {
        // پشتیبانی از object و array
        if (Array.isArray(dto.perCompany)) {
          orderDtos = orderDtos.map(order => {
            let overrides: Record<string, unknown> | undefined = undefined;
            if (dto.perCompany) {
              overrides = (dto.perCompany as Array<{ companyId: string }>).find((o) => o.companyId === order.companyId);
            }
            return {
              ...order,
              ...(overrides ?? {}),
            };
          });
        } else {
          orderDtos = orderDtos.map(order => {
            let overrides: Record<string, unknown> | undefined = undefined;
            if (dto.perCompany) {
              const rawOverride = (dto.perCompany as Record<string, unknown>)[order.companyId];
              overrides = typeof rawOverride === 'object' && rawOverride !== null ? rawOverride as Record<string, unknown> : undefined;
            }
            return {
              ...order,
              ...(overrides ?? {}),
            };
          });
        }
      } else {
        orderDtos = orderDtos.map(order => ({
          ...order,
          shippingAddress: dto.shippingAddress,
          paymentMethod: dto.paymentMethod,
        }));
      }

      // Batch fetch product data used in the cart
      const productIdStrs = Array.from(new Set(cart.items.map(i => String(i.productId))));
      const productIds = productIdStrs.map(id => (Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : id));
      const repoProvider: any = (this.productRepository && typeof (this.productRepository as any).findManyByCondition === 'function')
        ? this.productRepository
        : (this.productsService as any);

      let products: Array<{ _id: Types.ObjectId; basePrice: number; discount?: number; variants?: Array<{ name: string; options: Array<{ value: string; priceModifier?: number }> }>; stock: number; companyId: string }> = [];
      if (repoProvider && typeof repoProvider.findManyByCondition === 'function') {
        products = await repoProvider.findManyByCondition({ _id: { $in: productIds } }, { session: orderSession });
      }
      if (!products || products.length === 0) {
        throw new BadRequestException('Products not found for cart items');
      }

      const productMap = new Map<string, typeof products[0]>();
      for (const p of products) { productMap.set(p._id.toString(), p); }

      // اعتبارسنجی موجودی و قیمت قبل از رزرو
      const insufficientStock: string[] = [];
      for (const item of cart.items) {
        const product = productMap.get(String(item.productId));
        if (!product) throw new BadRequestException(`Product ${item.productId} not found`);
        if (product.stock < item.quantity) {
          insufficientStock.push(String(item.productId));
        }
        const currentPrice = Math.round(computeFinalPrice(product, item.variant));
        if (item.priceAtAdd && Math.abs(item.priceAtAdd - currentPrice) > 0) {
          throw new BadRequestException(
            `Price changed for product ${item.productId}. Cart price: ${item.priceAtAdd}, current price: ${currentPrice}. Please refresh your cart.`,
          );
        }
      }
      if (insufficientStock.length > 0) {
        throw new BadRequestException(`Insufficient stock for products: ${insufficientStock.join(', ')}`);
      }

      // رزرو موجودی
      const simpleItems = cart.items.map(it => ({
        productId: new Types.ObjectId(it.productId),
        qty: Number(it.quantity || 0),
      }));
      const modified = await this.productRepository.bulkDecrementStock(simpleItems, orderSession);
      if (modified !== simpleItems.length) {
        throw new BadRequestException(`Insufficient stock for products: ${simpleItems.map(i => i.productId).join(', ')}`);
      }

      // helper to compute final price per product + variant
      function computeFinalPrice(product: typeof products[0], selectedVariant?: { name: string; value: string }) {
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
        return Math.round(Math.max(price, 0));
      }

      // ساخت سفارش‌ها
      const orders: IOrder[] = [];
      for (const orderDto of orderDtos) {
        const items = orderDto.items.map((item: { productId: string; variant?: { name: string; value: string }; quantity: number }) => {
          const product = productMap.get(String(item.productId));
          if (!product) throw new BadRequestException(`Product not found: ${item.productId}`);
          const finalPrice = computeFinalPrice(product, item.variant);
          return {
            ...item,
            priceAtAdd: finalPrice,
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

      await this.cartsService.checkout(dto.userId, orderSession);
      return orders;
    }, session);
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
      // اعتبارسنجی آیتم‌ها مشابه متد create
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
    }, session).catch(error => {
      throw new BadRequestException(`Failed to update order: ${error.message}`);
    });
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

      const updateData = { status: OrdersStatus.PAID };
      const updatedOrder = await this.orderRepository.updateById(id, updateData, orderSession);
      return updatedOrder;
    }, session).catch(error => {
      throw new BadRequestException(`Failed to mark order as paid: ${error.message}`);
    });
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
    }, session).catch(error => {
      throw new BadRequestException(`Failed to mark order as shipped: ${error.message}`);
    });
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
    }, session).catch(error => {
      throw new BadRequestException(`Failed to mark order as delivered: ${error.message}`);
    });
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

      const updateData = { status: OrdersStatus.REFUNDED };
      const updatedOrder = await this.orderRepository.updateById(id, updateData, orderSession);
      return updatedOrder;
    }, session).catch(error => {
      throw new BadRequestException(`Failed to refund order: ${error.message}`);
    });
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

      const updateData = { status: OrdersStatus.COMPLETED, confirmedAt: new Date() };
      const updatedOrder = await this.orderRepository.updateById(orderId, updateData, orderSession);


      // خواندن شناسه واسطه از env
      const intermediaryId = process.env.INTERMEDIARY_WALLET_ID || 'default_intermediary_id';
      // بررسی موجودی کیف پول واسطه قبل از انتقال وجه
      const intermediaryWallet = await this.walletsService.getWallet({ ownerId: intermediaryId, ownerType: WalletOwnerType.INTERMEDIARY }, orderSession);
      if (!intermediaryWallet || intermediaryWallet.balance < order.totalPrice) {
        throw new BadRequestException('Insufficient intermediary wallet balance');
      }
      await this.walletsService.transfer(
        { ownerId: intermediaryId, ownerType: WalletOwnerType.INTERMEDIARY },
        { ownerId: order.companyId.toString(), ownerType: WalletOwnerType.COMPANY },
        order.totalPrice,
        orderSession,
      );

      return updatedOrder;
    }, session).catch(error => {
      throw new BadRequestException(`Failed to confirm delivery: ${error.message}`);
    });
  }
}
