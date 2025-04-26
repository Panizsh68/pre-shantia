import { BaseRepository, IBaseRepository } from "src/utils/base.repository";
import { Product } from "../entities/product.entity";
import { Injectable } from "@nestjs/common";

export interface IProductRepository extends IBaseRepository<Product> {}


@Injectable()
export class ProductRepository extends BaseRepository<Product> {}