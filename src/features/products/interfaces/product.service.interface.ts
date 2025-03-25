import { DeleteResult, UpdateResult } from "mongoose";
import { CreateProductDto } from "../dto/create-product.dto";
import { UpdateProductDto } from "../dto/update-product.dto";
import { Product } from "../entities/product.entity";

export interface IProductService {
    createProduct(createProductDto: CreateProductDto): Promise<Product>, 
    findAllProducts(): Promise<Product[]>,
    findOneProduct(id: string): Promise<Product>,
    updateProduct(id: string, updateProductDto: UpdateProductDto): Promise<UpdateResult>,
    removeProduct(id: string): Promise<DeleteResult>
}