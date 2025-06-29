import { Types } from 'mongoose';

export interface IUser {
  phoneNumber: string;
  nationalId: string;
  roles?: string[];
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
