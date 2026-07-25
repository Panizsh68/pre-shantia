import { CreateTransportingDto } from '../dto/create-transporting.dto';
import { UpdateTransportingDto } from '../dto/update-transporting.dto';
import { ITransporting } from './transporting.interface';

export interface ITransportService {
  create(dto: CreateTransportingDto): Promise<ITransporting>;
  findAll(page?: number, limit?: number): Promise<{ items: ITransporting[]; total: number; page: number; limit: number }>;
  findById(id: string): Promise<ITransporting>;
  findByOrderId(orderId: string): Promise<ITransporting>;
  findByCompanyId(companyId: string): Promise<ITransporting[]>;
  update(dto: UpdateTransportingDto): Promise<ITransporting>;
  cancel(id: string): Promise<ITransporting>;
  markAsDelivered(id: string, estimatedDelivery?: Date): Promise<ITransporting>;
}
