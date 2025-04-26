import { Inject, Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { IPaymentRepository } from './repositories/payments.repository';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentsService {
  constructor(@Inject('PaymentRepository') private readonly paymentRepository: IPaymentRepository) {}
  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    return await this.paymentRepository.create(createPaymentDto);
  }

  async findAll(): Promise<Payment[]> {
    return await this.paymentRepository.findAll();
  }

  async findOne(id: string): Promise<Payment | null> {
    return await this.paymentRepository.findById(id);
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<Payment | null> {
    return await this.paymentRepository.update(id, updatePaymentDto);
  }

  async remove(id: string): Promise<boolean> {
    return await this.paymentRepository.delete(id);
  }
}
