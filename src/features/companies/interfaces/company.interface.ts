import { Types } from 'mongoose';

export interface ICompany {
  name: string;
  address?: string;
  phone?: string;
  email: string;
  registrationNumber: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
}
