import { FindManyOptions } from 'src/libs/repository/interfaces/base-repo-options.interface';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { IProduct } from './product.interface';
import { ClientSession } from 'mongoose';
import { ProductStatus } from '../enums/product-status.enum';
import { TopProduct } from './top-product.interface';
import { TokenPayload } from 'src/features/auth/interfaces/token-payload.interface';

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
    tokenPayload?: TokenPayload,
    session?: ClientSession,
  ): Promise<IProduct>;
  findAll(options: FindManyOptions, session?: ClientSession): Promise<IProduct[]>;
  findOne(id: string, session?: ClientSession): Promise<IProduct>;
  update(
    id: string,
    updateProductDto: UpdateProductDto,
    userId: string,
    tokenPayload?: TokenPayload,
    session?: ClientSession,
  ): Promise<IProduct>;
  remove(id: string, userId: string, tokenPayload?: TokenPayload, session?: ClientSession): Promise<void>;
  existsByCompany(companyId: string, session?: ClientSession): Promise<boolean>;
  countByCategory(categoryId: string, session?: ClientSession): Promise<number>;
  getTopProductsByRating(limit: number, session?: ClientSession): Promise<TopProduct[]>;
  transactionalCreate(
    createProductDto: CreateProductDto,
    userId: string,
    session?: ClientSession,
  ): Promise<IProduct>;
  transactionalUpdate(
    id: string,
    updateProductDto: UpdateProductDto,
    userId: string,
    tokenPayload?: TokenPayload,
    session?: ClientSession,
  ): Promise<IProduct>;
  transactionalRemove(id: string, userId: string, tokenPayload?: TokenPayload, session?: ClientSession): Promise<void>;
  existsByName(name: string, session?: ClientSession): Promise<boolean>;
  count(session?: ClientSession): Promise<number>;
  searchProducts(query: string, options?: FindManyOptions): Promise<IProduct[]>;
  findByCompanyId(companyId: string, options?: FindManyOptions, session?: ClientSession): Promise<IProduct[]>;
  /**
   * Get products that currently have a discount (offers).
   * Supports pagination and other FindManyOptions.
   */
  getOffers(options?: FindManyOptions, session?: ClientSession): Promise<IProduct[]>;
  /**
   * Update only the status of a product. Returns the updated product.
   */
  updateStatus(id: string, status: ProductStatus, userId: string, session?: ClientSession): Promise<IProduct>;
}
