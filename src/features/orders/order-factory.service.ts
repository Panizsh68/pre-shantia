import { Injectable } from '@nestjs/common';
import { ICart } from '../carts/interfaces/cart.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { CartItemDto } from '../carts/dto/cart-item.dto';
import { OrdersStatus } from './enums/orders.status.enum';

@Injectable()
export class OrderFactoryService {
  buildOrdersFromCart(cart: ICart): CreateOrderDto[] {
    const grouped = new Map<string, CartItemDto[]>();

    for (const item of cart.items) {
      if (!grouped.has(item.companyId)) {
        grouped.set(item.companyId, []);
      }
      grouped.get(item.companyId)!.push(item);
    }

    // حالت فقط یک شرکت در cart → یه سفارش تکی بساز
    if (grouped.size === 1) {
      const [companyId, items] = Array.from(grouped.entries())[0];
      const totalPrice = items.reduce((sum, item) => sum + item.priceAtAdd * item.quantity, 0);

      return [
        {
          userId: cart.userId,
          items: items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
          totalPrice,
          companyId,
          status: OrdersStatus.PENDING,
          shippingAddress: '',
          paymentMethod: '',
          transportId: undefined,
        },
      ];
    }

    // حالت چند شرکت → چند سفارش بساز
    const orders: CreateOrderDto[] = [];

    for (const [companyId, items] of grouped.entries()) {
      const totalPrice = items.reduce((sum, item) => sum + item.priceAtAdd * item.quantity, 0);

      orders.push({
        userId: cart.userId,
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        totalPrice,
        companyId,
        status: OrdersStatus.PENDING,
        shippingAddress: '',
        paymentMethod: '',
        transportId: undefined,
      });
    }

    return orders;
  }
}
