import { BaseRepository, IBaseRepository } from "src/utils/base.repository";
import { Order } from "../entities/order.entity";
import { Injectable } from "@nestjs/common";

export interface IOrderRepository extends IBaseRepository<Order> {}

@Injectable()
export class OrderRepository extends BaseRepository<Order> implements IOrderRepository {}