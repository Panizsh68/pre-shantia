import { BadRequestException, Injectable } from '@nestjs/common';
import { ICart } from '../carts/interfaces/cart.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { CartItemDto } from '../carts/dto/cart-item.dto';
import { OrdersStatus } from './enums/orders.status.enum';
import { toReferenceIdString } from 'src/utils/reference-id.util';

@Injectable()
export class OrderFactoryService {
  buildOrdersFromCart(cart: ICart): CreateOrderDto[] {
    const grouped = new Map<string, CartItemDto[]>();

    for (const item of cart.items) {
      const companyId = toReferenceIdString(item.companyId);
      const productId = toReferenceIdString(item.productId);
      if (!companyId) {
        throw new BadRequestException('Cart item missing companyId — cannot build multi-vendor orders');
      }
      if (!productId) {
        throw new BadRequestException('Cart item missing productId — cannot build order');
      }
      if (!grouped.has(companyId)) {
        grouped.set(companyId, []);
      }
      grouped.get(companyId)!.push({ ...item, productId, companyId });
    }

    const orders: CreateOrderDto[] = [];
    for (const [companyId, items] of grouped.entries()) {
      const totalPrice = items.reduce((sum, item) => sum + Number(item.priceAtAdd || 0) * item.quantity, 0);
      orders.push({
        userId: cart.userId,
        items: items.map(i => ({
          productId: i.productId,
          companyId: i.companyId,
          quantity: i.quantity,
          priceAtAdd: Number(i.priceAtAdd || 0),
          variant: i.variant,
          variants: i.variants,
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
