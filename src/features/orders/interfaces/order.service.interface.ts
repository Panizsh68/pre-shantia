import { DeleteResult, UpdateResult } from "mongoose";
import { CreateOrderDto } from "../dto/create-order.dto";
import { UpdateOrderDto } from "../dto/update-order.dto";
import { Order } from "../entities/order.entity";
import { QueryOptionsDto } from "src/utils/query-options.dto";

export interface IOrderService {
    create(createOrderDto: CreateOrderDto): Promise<Order>,
    findAll(options: QueryOptionsDto): Promise<Order[]>,
    findOne(id: string): Promise<Order | null>,
    update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order | null>,
    remove(id: string): Promise<boolean>
}