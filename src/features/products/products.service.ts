
import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Types, ClientSession, PipelineStage } from 'mongoose';
import { toPlain, toPlainArray } from 'src/libs/repository/utils/doc-mapper';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { IProductService } from './interfaces/product.service.interface';
import { IProductRepository } from './repositories/product.repository';
import { FindManyOptions } from 'src/libs/repository/interfaces/base-repo-options.interface';
import { IProduct } from './interfaces/product.interface';
import { TopProduct } from './interfaces/top-product.interface';
import { RequestContext } from 'src/common/types/request-context.interface';
import { ProductStatus } from './enums/product-status.enum';
import { AdvancedSearchParams } from './types/advanced-search-params.type';

@Injectable()
export class ProductsService implements IProductService {
  async searchByPriceAndCompany(
    params: { maxPrice?: number; companyName?: string },
    options: FindManyOptions = {},
  ): Promise<IProduct[]> {
    const page = options.page && options.page > 0 ? options.page : 1;
    const perPage = options.perPage && options.perPage > 0 ? options.perPage : 10;
    const sort = options.sort?.map(s => ({ field: s.field, order: s.order }));
    return this.repo.searchByPriceAndCompanyAggregate(params, page, perPage, undefined, sort);
  }
  constructor(
    @Inject('ProductRepository')
    private readonly repo: IProductRepository,
  ) { }

  private toObjectId(id: string): Types.ObjectId {
    return new Types.ObjectId(id);
  }

  private toObjectIdArray(ids?: string[]): Types.ObjectId[] {
    return ids?.map(this.toObjectId) || [];
  }

  async create(
    dto: CreateProductDto,
    userId: string,
    ctx: RequestContext,
    session?: ClientSession,
  ): Promise<IProduct> {
    const { companyId, categories, ...rest } = dto;
    const data: Partial<Product> = {
      ...rest,
      companyId: this.toObjectId(companyId),
      categories: this.toObjectIdArray(categories),
      createdBy: this.toObjectId(userId),
      updatedBy: this.toObjectId(userId),
    };
    const productDoc = await this.repo.createOne(data, session);
    return toPlain<IProduct>(productDoc);
  }

  async findAll(options: FindManyOptions = {}, session?: ClientSession): Promise<IProduct[]> {
    const queryOptions: FindManyOptions = {
      ...options,
      conditions: { ...options.conditions, status: ProductStatus.ACTIVE },
      populate: options.populate || ['companyId', 'categories'],
      session,
    };
    const products = await this.repo.findAll(queryOptions);
    return toPlainArray<IProduct>(products);
  }

  async findOne(id: string, session?: ClientSession): Promise<IProduct> {
    const productDoc = await this.repo.findById(id, { session });
    if (!productDoc || productDoc.status !== ProductStatus.ACTIVE) throw new NotFoundException(`Product with id ${id} not found or inactive`);
    return toPlain<IProduct>(productDoc);
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    userId: string,
    session?: ClientSession,
  ): Promise<IProduct> {
    const existing = await this.repo.findById(id, { session });
    if (!existing) throw new NotFoundException(`Product with id ${id} not found`);
    if (existing.createdBy.toString() !== userId)
      throw new ForbiddenException('You do not have permission to update this product');
    const { companyId, categories, ...rest } = dto;
    const data: Partial<Product> = {
      ...rest,
      companyId: this.toObjectId(companyId!),
      categories: this.toObjectIdArray(categories),
      updatedBy: this.toObjectId(userId),
    };
    const updatedDoc = await this.repo.updateById(id, data, session);
    return toPlain<IProduct>(updatedDoc);
  }

  async remove(id: string, userId: string, session?: ClientSession): Promise<void> {
    const existing = await this.repo.findById(id, { session });
    if (!existing) throw new NotFoundException(`Product with id ${id} not found`);
    if (existing.createdBy.toString() !== userId)
      throw new ForbiddenException('You do not have permission to delete this product');
    await this.repo.deleteById(id, session);
  }

  async existsByCompany(companyId: string, session?: ClientSession): Promise<boolean> {
    return this.repo.existsByCondition({ companyId: this.toObjectId(companyId) }, session);
  }

  async countByCategory(categoryId: string, session?: ClientSession): Promise<number> {
    return this.repo.countByCondition({ categories: this.toObjectId(categoryId) }, session);
  }

  async getTopProductsByRating(limit = 5, session?: ClientSession): Promise<TopProduct[]> {
    return this.repo.getTopProductsByRating(limit, session);
  }

  async transactionalCreate(
    dto: CreateProductDto,
    userId: string,
    session?: ClientSession,
  ): Promise<IProduct> {
    const txn = session || (await this.repo.startTransaction());
    try {
      const result = await this.create(dto, userId, {} as RequestContext, txn);
      if (!session) await this.repo.commitTransaction(txn);
      return result;
    } catch (err) {
      if (!session) await this.repo.abortTransaction(txn);
      throw err;
    }
  }

  async existsByName(name: string, session?: ClientSession): Promise<boolean> {
    return this.repo.existsByCondition({ name }, session);
  }

  async count(session?: ClientSession): Promise<number> {
    return this.repo.countByCondition({}, session);
  }

  async searchProducts(
    query: string,
    options: FindManyOptions = {},
  ): Promise<IProduct[]> {
    const page = options.page && options.page > 0 ? options.page : 1;
    const perPage = options.perPage && options.perPage > 0 ? options.perPage : 10;
    // Only ACTIVE products
    if (!options.conditions) options.conditions = {};
    options.conditions.status = ProductStatus.ACTIVE;
    return this.repo.searchProductsAggregate(query, page, perPage);
  }

  async advancedSearchAggregate(params: AdvancedSearchParams): Promise<IProduct[]> {
    return this.repo.advancedSearchAggregate(params);
  }
}
