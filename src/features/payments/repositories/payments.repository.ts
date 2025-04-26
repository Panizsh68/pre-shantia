import { BaseRepository, IBaseRepository } from "src/utils/base.repository";
import { Payment } from "../entities/payment.entity";
import { Injectable } from "@nestjs/common";

export interface IPaymentRepository extends IBaseRepository<Payment> {}

@Injectable()
export class PaymentRepository extends BaseRepository<Payment> implements IPaymentRepository {}