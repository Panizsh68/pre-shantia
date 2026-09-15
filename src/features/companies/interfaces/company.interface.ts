import { Types } from 'mongoose';
import { SellerType } from '../enums/seller-type.enum';

export interface ICompany {
  name: string;
  sellerType: SellerType;
  address?: string;
  phone?: string;
  email: string;
  registrationNumber: string;
  status: string;
  nationalId?: string;
  image?: string; // URL to company logo/image
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  admins?: Types.ObjectId[];
}
