import { Schema } from 'mongoose';
import { DiscountType } from '../enums/discount-type.enum';
import { ICartItem } from '../interfaces/cart-item.interface';

export const CartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: String, ref: 'Product', required: true, index: true },
    companyId: { type: String, ref: 'Company', required: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    priceAtAdd: { type: Number, required: true, min: 0 },
    variant: {
      name: { type: String },
      value: { type: String },
    },
    notes: { type: String },
    discount: {
      type: new Schema(
        {
          type: { type: String, enum: Object.values(DiscountType), required: true },
          value: { type: Number, required: true },
        },
        { _id: false },
      ),
    },
  },
  { _id: false },
);
