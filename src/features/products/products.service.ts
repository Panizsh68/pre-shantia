
import { Inject, Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
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
import { IProfileService } from '../users/profile/interfaces/profile.service.interface';
import { ICompanyService } from '../companies/interfaces/company.service.interface';
import { TokenPayload } from 'src/features/auth/interfaces/token-payload.interface';
import { Resource } from 'src/features/permissions/enums/resources.enum';
import { Action } from 'src/features/permissions/enums/actions.enum';
import { PermissionsService } from 'src/features/permissions/permissions.service';
import { toObjectId, toObjectIdArray } from 'src/utils/objectid.util';

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
    @Inject('IProfileService') private readonly profileService: IProfileService,
    @Inject('ICompanyService') private readonly companyService: ICompanyService,
    private readonly permissionsService: PermissionsService,
  ) { }


  async create(
    dto: CreateProductDto,
    userId: string,
    tokenPayload?: TokenPayload,
    session?: ClientSession,
  ): Promise<IProduct> {
    // Resolve user's profile and companyId
    const profile = await this.profileService.getByUserId(userId);
    if (!profile) throw new BadRequestException('User profile not found');
    if (!profile.companyId) throw new BadRequestException('User does not belong to any company');

    const companyIdStr = profile.companyId.toString();

    // Permission check: user must have CREATE on PRODUCTS for their company
    this.permissionsService.ensurePermission(tokenPayload?.permissions, Resource.PRODUCTS, Action.CREATE, companyIdStr);
    // Ensure company exists
    await this.companyService.findOne(companyIdStr);

    const { companyId: _, categories, ...rest } = dto;
    const data: Partial<Product> = {
      ...rest,
      companyId: toObjectId(companyIdStr),
      categories: categories ? (categories.map((c) => toObjectId(c))) : [],
      createdBy: toObjectId(userId),
      updatedBy: toObjectId(userId),
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

  async findByCompanyId(companyId: string, options: FindManyOptions = {}, session?: ClientSession): Promise<IProduct[]> {
    // sanitize and build conditions
    const conditions = { ...(options.conditions || {}), companyId: toObjectId(companyId), status: ProductStatus.ACTIVE };
    const queryOptions: FindManyOptions = {
      ...options,
      conditions,
      populate: options.populate || ['companyId', 'categories'],
      session,
    };
    const products = await this.repo.findManyByCondition(conditions as any, queryOptions as any);
    return toPlainArray<IProduct>(products);
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
      companyId: companyId ? toObjectId(companyId) : existing.companyId,
      categories: categories ? toObjectIdArray(categories) : [],
      updatedBy: toObjectId(userId),
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
    return this.repo.existsByCondition({ companyId: toObjectId(companyId) }, session);
  }

  async countByCategory(categoryId: string, session?: ClientSession): Promise<number> {
    return this.repo.countByCondition({ categories: toObjectId(categoryId) }, session);
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
      const result = await this.create(dto, userId, undefined, txn);
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
