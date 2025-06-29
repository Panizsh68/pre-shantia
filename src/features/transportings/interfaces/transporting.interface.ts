import { TransportingStatus } from '../enums/transporting.status.enum';

export interface ITransporting {
  orderId: string;
  companyId: string;
  status: TransportingStatus;
  estimatedDelivery?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
