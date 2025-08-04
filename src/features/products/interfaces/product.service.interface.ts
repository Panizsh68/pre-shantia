import { FindManyOptions } from 'src/libs/repository/interfaces/base-repo-options.interface';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { IProduct } from './product.interface';
import { ClientSession } from 'mongoose';
import { TopProduct } from './top-product.interface';
import { RequestContext } from 'src/common/types/request-context.interface';

export interface IProductService {
  advancedSearchAggregate(params: {
    query?: string;
    maxPrice?: number;
    companyName?: string;
    categoryIds?: string[];
    page?: number;
    limit?: number;
    sort?: string;
  }): Promise<IProduct[]>;
  searchByPriceAndCompany(
    params: { maxPrice?: number; companyName?: string },
    options?: FindManyOptions
  ): Promise<IProduct[]>;
  create(
    createProductDto: CreateProductDto,
    userId: string,
    ctx: RequestContext,
    session?: ClientSession,
  ): Promise<IProduct>;
  findAll(options: FindManyOptions, session?: ClientSession): Promise<IProduct[]>;
  findOne(id: string, session?: ClientSession): Promise<IProduct>;
  update(
    id: string,
    updateProductDto: UpdateProductDto,
    userId: string,
    session?: ClientSession,
  ): Promise<IProduct>;
  remove(id: string, userId: string, session?: ClientSession): Promise<void>;
  existsByCompany(companyId: string, session?: ClientSession): Promise<boolean>;
  countByCategory(categoryId: string, session?: ClientSession): Promise<number>;
  getTopProductsByRating(limit: number, session?: ClientSession): Promise<TopProduct[]>;
  transactionalCreate(
    createProductDto: CreateProductDto,
    userId: string,
    session?: ClientSession,
  ): Promise<IProduct>;
  existsByName(name: string, session?: ClientSession): Promise<boolean>;
  count(session?: ClientSession): Promise<number>;
  searchProducts(query: string, options?: FindManyOptions): Promise<IProduct[]>;
}
