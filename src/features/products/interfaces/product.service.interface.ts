import { DeleteResult, UpdateResult } from "mongoose";
import { CreateProductDto } from "../dto/create-product.dto";
import { UpdateProductDto } from "../dto/update-product.dto";
import { Product } from "../entities/product.entity";

export interface IProductService {
    create(createProductDto: CreateProductDto): Promise<Product>, 
    findAll(): Promise<Product[]>,
    findById(id: string): Promise<Product | null>,
    update(id: string, updateProductDto: UpdateProductDto): Promise<Product | null>,
    remove(id: string): Promise<boolean>
}