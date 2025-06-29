import { FindManyOptions } from 'src/libs/repository/interfaces/base-repo-options.interface';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { IProduct } from './product.interface';
import { ClientSession } from 'mongoose';
import { Product } from '../entities/product.entity';
import { TopProduct } from './top-product.interface';

export interface IProductService {
  create(createProductDto: CreateProductDto, session?: ClientSession): Promise<IProduct>;
  findAll(options: FindManyOptions, session?: ClientSession): Promise<IProduct[]>;
  findOne(id: string, session?: ClientSession): Promise<Product>;
  update(
    id: string,
    updateProductDto: UpdateProductDto,
    session?: ClientSession,
  ): Promise<IProduct>;
  remove(id: string, session?: ClientSession): Promise<boolean>;
  existsByCompany(companyId: string, session?: ClientSession): Promise<boolean>;
  countByCategory(categoryId: string, session?: ClientSession): Promise<number>;
  getTopProductsBySales(limit: number, session?: ClientSession): Promise<TopProduct[]>;
  transactionalCreate(
    createProductDto: CreateProductDto,
    session?: ClientSession,
  ): Promise<IProduct>;
}
