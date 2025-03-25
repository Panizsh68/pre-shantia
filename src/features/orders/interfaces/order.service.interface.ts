import { DeleteResult, UpdateResult } from "mongoose";
import { CreateOrderDto } from "../dto/create-order.dto";
import { UpdateOrderDto } from "../dto/update-order.dto";
import { Order } from "../entities/order.entity";

export interface IOrderService {
    createOrder(createOrderDto: CreateOrderDto): Promise<Order>,
    findAllOrders(): Promise<Order[]>,
    findOneOrder(id: string): Promise<Order>,
    updateOrder(id: string, updateOrderDto: UpdateOrderDto): Promise<UpdateResult>,
    removeOrder(id: string): Promise<DeleteResult>
}