import { OrdersStatus } from '../enums/orders.status.enum';
import { IOrderItem } from './order-item.interface';

export interface IOrder {
  userId: string;
  items: IOrderItem[];
  totalPrice: number;
  status: OrdersStatus;
  shippingAddress?: string;
  paymentMethod?: string;
  companyId: string;
  transportId?: string;
  ticketId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
