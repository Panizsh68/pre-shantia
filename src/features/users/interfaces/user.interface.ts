import { Types } from 'mongoose';
import { IPermission } from 'src/features/permissions/interfaces/permissions.interface';

export interface IUser {
  phoneNumber: string;
  nationalId: string;
  permissions: IPermission[];
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
