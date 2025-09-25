import { Schema } from 'mongoose';
import { IOrderItem } from '../interfaces/order-item.interface';

export const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: String, ref: 'Product', required: true, index: true },
    companyId: { type: String, ref: 'Company', required: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    priceAtAdd: { type: Number, required: true, min: 0 },
    variant: {
      name: { type: String },
      value: { type: String },
    },
  },
  { _id: false },
);

export default OrderItemSchema;
