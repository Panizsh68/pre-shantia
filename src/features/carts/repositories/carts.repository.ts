import { BaseRepository, IBaseRepository } from "src/utils/base.repository";
import { Cart } from "../entities/cart.entity";
import { Injectable } from "@nestjs/common";

export interface ICartRepository extends IBaseRepository<Cart> {}

@Injectable()
export class CartRepository extends BaseRepository<Cart> implements ICartRepository {}