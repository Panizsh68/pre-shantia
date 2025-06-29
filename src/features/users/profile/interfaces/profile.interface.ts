import { Types } from 'mongoose';
import { ICart } from 'src/features/carts/interfaces/cart.interface';

export interface IProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber: string;
  address?: string;
  nationalId: string;
  walletId?: Types.ObjectId;
  orders?: Types.ObjectId[];
  transactions?: Types.ObjectId[];
  favorites?: Types.ObjectId[];
  cart?: ICart;
}
