import { CreateProductDto } from "../dto/create-product.dto";
import { UpdateProductDto } from "../dto/update-product.dto";
import { Product } from "../entities/product.entity";
import { QueryOptionsDto } from "src/utils/query-options.dto";

export interface IProductService {
    create(createProductDto: CreateProductDto): Promise<Product>, 
    findAll(options: QueryOptionsDto): Promise<Product[]>,
    findOne(id: string): Promise<Product | null>,
    update(id: string, updateProductDto: UpdateProductDto): Promise<Product | null>,
    remove(id: string): Promise<boolean>
}