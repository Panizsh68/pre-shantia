
import { Inject, Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Types, ClientSession, PipelineStage, FilterQuery } from 'mongoose';
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
import { IImageUploadServiceToken, IImageUploadService } from '../image-upload/interfaces/image-upload.service.interface';
import { CreatePresignDto } from '../image-upload/dto/create-presign.dto';
import { CreatePresignResponseDto } from '../image-upload/dto/presign-response.dto';
import { TokenPayload } from 'src/features/auth/interfaces/token-payload.interface';
import { Resource } from 'src/features/permissions/enums/resources.enum';
import { Action } from 'src/features/permissions/enums/actions.enum';
import { PermissionsService } from 'src/features/permissions/permissions.service';
import { toObjectId, toObjectIdArray } from 'src/utils/objectid.util';
import { SearchProductParams } from './interfaces/search-params.interface';

@Injectable()
export class ProductsService implements IProductService {
  async searchByPriceAndCompany(
    params: SearchProductParams,
    options: FindManyOptions = {},
  ): Promise<IProduct[]> {
    // entry log
    // eslint-disable-next-line no-console
    console.log(`[ProductsService.searchByPriceAndCompany] entry params=${JSON.stringify(params)} options=${JSON.stringify(options)}`);
    const page = options.page && options.page > 0 ? options.page : 1;
    const perPage = options.perPage && options.perPage > 0 ? options.perPage : 10;

    // Transform sort to handle finalPrice special case
    const sort = options.sort?.map(s => {
      if (s.field === 'finalPrice') {
        // For finalPrice sorting, we need to calculate it in aggregation
        return {
          field: 'calculatedFinalPrice',
          order: s.order
        };
      }
      return { field: s.field, order: s.order };
    });

    // Add maxFinalPrice if maxPrice is specified (considering discount)
    const searchParams = { ...params };
    if (params.maxPrice !== undefined) {
      if (params.maxPrice < 0) {
        throw new BadRequestException('Maximum price cannot be negative');
      }
      searchParams.maxFinalPrice = params.maxPrice;
      delete searchParams.maxPrice; // Remove original maxPrice to avoid double filtering
    }

    try {
      const result = await this.repo.searchByPriceAndCompanyAggregate(searchParams, page, perPage, undefined, sort);
      // eslint-disable-next-line no-console
      console.log(`[ProductsService.searchByPriceAndCompany] success count=${Array.isArray(result) ? result.length : 0}`);
      return result;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsService.searchByPriceAndCompany] error', err);
      throw err;
    }
  }
  constructor(
    @Inject('ProductRepository')
    private readonly repo: IProductRepository,
    @Inject('IProfileService') private readonly profileService: IProfileService,
    @Inject('ICompanyService') private readonly companyService: ICompanyService,
    private readonly permissionsService: PermissionsService,
    @Inject(IImageUploadServiceToken) private readonly imageUploadService?: IImageUploadService,
  ) { }


  async create(
    dto: CreateProductDto,
    userId: string,
    tokenPayload?: TokenPayload,
    session?: ClientSession,
  ): Promise<IProduct> {
    // detailed logging around create flow
    // eslint-disable-next-line no-console
    console.log(`[ProductsService.create] entry userId=${userId} dtoKeys=${Object.keys(dto || {}).join(',')}`);
    try {
      // Resolve user's profile and companyId
      const profile = await this.profileService.getByUserId(userId);
      if (!profile) {
        // eslint-disable-next-line no-console
        console.error('[ProductsService.create] missing profile for userId=', userId);
        throw new BadRequestException('User profile not found');
      }
      if (!profile.companyId) {
        // eslint-disable-next-line no-console
        console.error('[ProductsService.create] user has no company companyId missing userId=', userId);
        throw new BadRequestException('User does not belong to any company');
      }

      const companyIdStr = profile.companyId.toString();

      // Permission check: user must have CREATE on PRODUCTS for their company
      // eslint-disable-next-line no-console
      console.log(`[ProductsService.create] checking permissions for companyId=${companyIdStr}`);
      this.permissionsService.ensurePermission(tokenPayload?.permissions, Resource.PRODUCTS, Action.CREATE, companyIdStr);
      // Ensure company exists
      // eslint-disable-next-line no-console
      console.log(`[ProductsService.create] validating company exists companyId=${companyIdStr}`);
      await this.companyService.findOne(companyIdStr);

      // Check for duplicates
      const [nameExists, slugExists, skuExists] = await Promise.all([
        this.repo.existsByCondition({
          name: dto.name,
          status: { $ne: ProductStatus.DELETED }
        }, session),
        this.repo.existsByCondition({
          slug: dto.slug,
          status: { $ne: ProductStatus.DELETED }
        }, session),
        this.repo.existsByCondition({
          sku: dto.sku,
          status: { $ne: ProductStatus.DELETED }
        }, session)
      ]);

      if (nameExists) {
        throw new BadRequestException(`Product with name "${dto.name}" already exists`);
      }
      if (slugExists) {
        throw new BadRequestException(`Product with slug "${dto.slug}" already exists`);
      }
      if (skuExists) {
        throw new BadRequestException(`Product with SKU "${dto.sku}" already exists`);
      }

      const { categories, ...rest } = dto as CreateProductDto;
      const data: Partial<Product> = {
        ...rest,
        companyId: toObjectId(companyIdStr),
        categories: categories ? (categories.map((c) => toObjectId(c))) : [],
        createdBy: toObjectId(userId),
        updatedBy: toObjectId(userId),
      };

      // Integration: if the DTO contains files metadata to presign (client wants to upload images)
      const imagesMeta = (dto as CreateProductDto).imagesMeta;
      if (imagesMeta && imagesMeta.length > 0 && this.imageUploadService) {
        // eslint-disable-next-line no-console
        console.log('[ProductsService.create] presigning images count=', imagesMeta.length);
        const presignPayload: CreatePresignDto = { type: 'product', files: imagesMeta };
        const presignResult: CreatePresignResponseDto = await this.imageUploadService.createPresignedUrls(presignPayload);
        data.images = presignResult.items.map((it) => ({ url: it.publicUrl }));
      }

      // persist
      // eslint-disable-next-line no-console
      console.log('[ProductsService.create] creating product in repo');
      const productDoc = await this.repo.createOne(data, session);
      const result = toPlain<IProduct>(productDoc);
      // eslint-disable-next-line no-console
      console.log('[ProductsService.create] success id=', (productDoc && (productDoc as any)._id) || 'unknown');
      return result;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsService.create] error', err);
      throw err;
    }
  }

  async findAll(options: FindManyOptions = {}, session?: ClientSession): Promise<IProduct[]> {
    // eslint-disable-next-line no-console
    console.log('[ProductsService.findAll] entry options=', JSON.stringify(options));
    try {
      const queryOptions: FindManyOptions = {
        ...options,
        conditions: {
          ...options.conditions,
          status: ProductStatus.ACTIVE,
          $or: [
            { deletedAt: { $exists: false } },
            { deletedAt: null }
          ]
        },
        populate: options.populate || ['companyId', 'categories'],
        session,
      };
      const products = await this.repo.findAll(queryOptions);
      // eslint-disable-next-line no-console
      console.log('[ProductsService.findAll] success count=', Array.isArray(products) ? products.length : 0);
      return toPlainArray<IProduct>(products);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsService.findAll] error', err);
      throw err;
    }
  }

  async findOne(id: string, session?: ClientSession): Promise<IProduct> {
    // eslint-disable-next-line no-console
    console.log('[ProductsService.findOne] entry id=', id);
    try {
      const productDoc = await this.repo.findById(id, { session });
      if (!productDoc || productDoc.status !== ProductStatus.ACTIVE) {
        // eslint-disable-next-line no-console
        console.error('[ProductsService.findOne] not found or inactive id=', id);
        throw new NotFoundException(`Product with id ${id} not found or inactive`);
      }
      // eslint-disable-next-line no-console
      console.log('[ProductsService.findOne] success id=', id);
      return toPlain<IProduct>(productDoc);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsService.findOne] error', err);
      throw err;
    }
  }

  async findByCompanyId(companyId: string, options: FindManyOptions = {}, session?: ClientSession): Promise<IProduct[]> {
    // eslint-disable-next-line no-console
    console.log('[ProductsService.findByCompanyId] entry companyId=', companyId, 'options=', JSON.stringify(options));
    try {
      // sanitize and build conditions
      const conditions = {
        ...(options.conditions || {}),
        companyId: toObjectId(companyId),
        status: ProductStatus.ACTIVE,
        $or: [
          { deletedAt: { $exists: false } },
          { deletedAt: null }
        ]
      };
      const queryOptions: FindManyOptions = {
        ...options,
        conditions,
        populate: options.populate || ['companyId', 'categories'],
        session,
      };
      const typedConditions: FilterQuery<Product> = conditions as unknown as FilterQuery<Product>;
      const typedQueryOptions: FindManyOptions = queryOptions;
      const products = await this.repo.findManyByCondition(typedConditions, typedQueryOptions);
      // eslint-disable-next-line no-console
      console.log('[ProductsService.findByCompanyId] success count=', Array.isArray(products) ? products.length : 0);
      return toPlainArray<IProduct>(products);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsService.findByCompanyId] error', err);
      throw err;
    }
  }

  async getOffers(options: FindManyOptions = {}, session?: ClientSession): Promise<IProduct[]> {
    // eslint-disable-next-line no-console
    console.log('[ProductsService.getOffers] entry options=', JSON.stringify(options));
    try {
      // Find products with discount greater than 0 and active status
      const condition: any = { discount: { $gt: 0 }, status: 'active' };
      // Delegate to repository's findManyByCondition which supports pagination/sort/populate
      const products = await (this.repo as any).findManyByCondition(condition, { ...options, session });
      // eslint-disable-next-line no-console
      console.log('[ProductsService.getOffers] success count=', Array.isArray(products) ? products.length : 0);
      return products as IProduct[];
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsService.getOffers] error', err);
      throw err;
    }
  }

  async updateStatus(id: string, status: import('./enums/product-status.enum').ProductStatus, userId: string, session?: ClientSession): Promise<IProduct> {
    // eslint-disable-next-line no-console
    console.log('[ProductsService.updateStatus] entry id=', id, 'status=', status, 'userId=', userId);
    try {
      const updateData: Partial<Product> & { deletedAt?: Date | undefined } = {
        status,
        updatedBy: toObjectId(userId),
      };

      if (status === ProductStatus.DELETED) {
        updateData.deletedAt = new Date();
      } else {
        // clear deletedAt when transitioning out of DELETED
        updateData.deletedAt = undefined;
      }

      const updatedDoc = await this.repo.updateById(id, updateData, session);
      // eslint-disable-next-line no-console
      console.log('[ProductsService.updateStatus] success id=', id);
      return toPlain<IProduct>(updatedDoc);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsService.updateStatus] error', err);
      throw err;
    }
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    userId: string,
    tokenPayload?: TokenPayload,
    session?: ClientSession,
  ): Promise<IProduct> {
    // eslint-disable-next-line no-console
    console.log('[ProductsService.update] entry id=', id, 'userId=', userId, 'dtoKeys=', Object.keys(dto || {}).join(','));
    try {
      const existing = await this.repo.findById(id, { session });
      if (!existing) {
        // eslint-disable-next-line no-console
        console.error('[ProductsService.update] product not found id=', id);
        throw new NotFoundException(`Product with id ${id} not found`);
      }

      // owner can always update; otherwise require scoped permission for the product's company
      const existingCompanyId = existing.companyId?.toString();
      if (existing.createdBy.toString() !== userId) {
        // eslint-disable-next-line no-console
        console.log('[ProductsService.update] checking permissions for update companyId=', existingCompanyId);
        this.permissionsService.ensurePermission(tokenPayload?.permissions, Resource.PRODUCTS, Action.UPDATE, existingCompanyId);
      }

      const { categories, ...rest } = dto as UpdateProductDto;
      // Check name uniqueness if being updated
      if (dto.name && dto.name !== existing.name) {
        const nameExists = await this.repo.existsByCondition({
          name: dto.name,
          _id: { $ne: toObjectId(id) },
          status: { $ne: ProductStatus.DELETED }
        }, session);
        if (nameExists) {
          throw new BadRequestException(`Product with name "${dto.name}" already exists`);
        }
      }

      const data: Partial<Product> = {
        ...rest,
        // companyId cannot be changed by the client; preserve existing.companyId
        companyId: existing.companyId,
        categories: categories ? toObjectIdArray(categories) : [],
        updatedBy: toObjectId(userId),
      };
      // eslint-disable-next-line no-console
      console.log('[ProductsService.update] updating repo id=', id);
      const updatedDoc = await this.repo.updateById(id, data, session);
      // eslint-disable-next-line no-console
      console.log('[ProductsService.update] success id=', id);
      return toPlain<IProduct>(updatedDoc);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsService.update] error', err);
      throw err;
    }
  }

  async remove(id: string, userId: string, tokenPayload?: TokenPayload, session?: ClientSession): Promise<void> {
    // eslint-disable-next-line no-console
    console.log('[ProductsService.remove] entry id=', id, 'userId=', userId);
    try {
      const existing = await this.repo.findById(id, { session });
      if (!existing) {
        // eslint-disable-next-line no-console
        console.error('[ProductsService.remove] not found id=', id);
        throw new NotFoundException(`Product with id ${id} not found`);
      }

      const existingCompanyId = existing.companyId?.toString();
      if (existing.createdBy.toString() !== userId) {
        // allow deletion if user has DELETE on PRODUCTS scoped to the company
        // eslint-disable-next-line no-console
        console.log('[ProductsService.remove] checking permissions for delete companyId=', existingCompanyId);
        this.permissionsService.ensurePermission(tokenPayload?.permissions, Resource.PRODUCTS, Action.DELETE, existingCompanyId);
      }

      // eslint-disable-next-line no-console
      console.log('[ProductsService.remove] soft deleting product id=', id);
      await this.repo.updateById(id, {
        status: ProductStatus.DELETED,
        updatedBy: toObjectId(userId),
        deletedAt: new Date()
      }, session);
      // eslint-disable-next-line no-console
      console.log('[ProductsService.remove] success id=', id);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsService.remove] error', err);
      throw err;
    }
  }

  async existsByCompany(companyId: string, session?: ClientSession): Promise<boolean> {
    // eslint-disable-next-line no-console
    console.log('[ProductsService.existsByCompany] entry companyId=', companyId);
    try {
      const result = await this.repo.existsByCondition({ companyId: toObjectId(companyId) }, session);
      // eslint-disable-next-line no-console
      console.log('[ProductsService.existsByCompany] result=', result);
      return result;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsService.existsByCompany] error', err);
      throw err;
    }
  }

  async countByCategory(categoryId: string, session?: ClientSession): Promise<number> {
    // eslint-disable-next-line no-console
    console.log('[ProductsService.countByCategory] entry categoryId=', categoryId);
    try {
      const result = await this.repo.countByCondition({ categories: toObjectId(categoryId) }, session);
      // eslint-disable-next-line no-console
      console.log('[ProductsService.countByCategory] result=', result);
      return result;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsService.countByCategory] error', err);
      throw err;
    }
  }

  async getTopProductsByRating(limit = 5, session?: ClientSession): Promise<TopProduct[]> {
    // eslint-disable-next-line no-console
    console.log('[ProductsService.getTopProductsByRating] entry limit=', limit);
    try {
      const raw = await this.repo.getTopProductsByRating(limit, session);
      // raw items come from aggregation with fields: _id, name, avgRating, company?
      const mapped: TopProduct[] = (raw || []).map((it: any) => ({
        id: String(it._id ?? it.id ?? ''),
        name: it.name ?? '',
        avgRating: typeof it.avgRating === 'number' ? it.avgRating : 0,
        company: it.company ? { id: String(it.company._id ?? it.company.id ?? ''), name: it.company.name } : undefined,
      }));
      // eslint-disable-next-line no-console
      console.log('[ProductsService.getTopProductsByRating] success count=', mapped.length);
      return mapped;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsService.getTopProductsByRating] error', err);
      throw err;
    }
  }

  async transactionalCreate(
    dto: CreateProductDto,
    userId: string,
    session?: ClientSession,
  ): Promise<IProduct> {
    // eslint-disable-next-line no-console
    console.log('[ProductsService.transactionalCreate] entry userId=', userId);
    const txn = session || (await this.repo.startTransaction());
    try {
      const result = await this.create(dto, userId, undefined, txn);
      if (!session) { await this.repo.commitTransaction(txn); }
      // eslint-disable-next-line no-console
      console.log('[ProductsService.transactionalCreate] success');
      return result;
    } catch (err) {
      if (!session) { await this.repo.abortTransaction(txn); }
      // eslint-disable-next-line no-console
      console.error('[ProductsService.transactionalCreate] error', err);
      throw err;
    }
  }

  async transactionalUpdate(
    id: string,
    dto: UpdateProductDto,
    userId: string,
    tokenPayload?: TokenPayload,
    session?: ClientSession,
  ): Promise<IProduct> {
    // eslint-disable-next-line no-console
    console.log('[ProductsService.transactionalUpdate] entry id=', id, 'userId=', userId);
    const txn = session || (await this.repo.startTransaction());
    try {
      const result = await this.update(id, dto, userId, tokenPayload, txn);
      if (!session) { await this.repo.commitTransaction(txn); }
      // eslint-disable-next-line no-console
      console.log('[ProductsService.transactionalUpdate] success id=', id);
      return result;
    } catch (err) {
      if (!session) { await this.repo.abortTransaction(txn); }
      // eslint-disable-next-line no-console
      console.error('[ProductsService.transactionalUpdate] error', err);
      throw err;
    }
  }

  async transactionalRemove(id: string, userId: string, tokenPayload?: TokenPayload, session?: ClientSession): Promise<void> {
    // eslint-disable-next-line no-console
    console.log('[ProductsService.transactionalRemove] entry id=', id, 'userId=', userId);
    const txn = session || (await this.repo.startTransaction());
    try {
      await this.remove(id, userId, tokenPayload, txn);
      if (!session) { await this.repo.commitTransaction(txn); }
      // eslint-disable-next-line no-console
      console.log('[ProductsService.transactionalRemove] success id=', id);
    } catch (err) {
      if (!session) { await this.repo.abortTransaction(txn); }
      // eslint-disable-next-line no-console
      console.error('[ProductsService.transactionalRemove] error', err);
      throw err;
    }
  }

  async existsByName(name: string, session?: ClientSession): Promise<boolean> {
    // eslint-disable-next-line no-console
    console.log('[ProductsService.existsByName] entry name=', name);
    try {
      const result = await this.repo.existsByCondition({ name }, session);
      // eslint-disable-next-line no-console
      console.log('[ProductsService.existsByName] result=', result);
      return result;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsService.existsByName] error', err);
      throw err;
    }
  }

  async count(session?: ClientSession): Promise<number> {
    // eslint-disable-next-line no-console
    console.log('[ProductsService.count] entry');
    try {
      const result = await this.repo.countByCondition({}, session);
      // eslint-disable-next-line no-console
      console.log('[ProductsService.count] result=', result);
      return result;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsService.count] error', err);
      throw err;
    }
  }

  async searchProducts(
    query: string,
    options: FindManyOptions = {},
  ): Promise<IProduct[]> {
    // eslint-disable-next-line no-console
    console.log('[ProductsService.searchProducts] entry query=', query, 'options=', JSON.stringify(options));
    try {
      const page = options.page && options.page > 0 ? options.page : 1;
      const perPage = options.perPage && options.perPage > 0 ? options.perPage : 10;
      // Only ACTIVE products
      if (!options.conditions) { options.conditions = {}; }
      options.conditions.status = ProductStatus.ACTIVE;
      const result = await this.repo.searchProductsAggregate(query, page, perPage);
      // eslint-disable-next-line no-console
      console.log('[ProductsService.searchProducts] success count=', Array.isArray(result) ? result.length : 0);
      return result;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsService.searchProducts] error', err);
      throw err;
    }
  }

  async advancedSearchAggregate(params: AdvancedSearchParams): Promise<IProduct[]> {
    // eslint-disable-next-line no-console
    console.log('[ProductsService.advancedSearchAggregate] entry params=', JSON.stringify(params));
    try {
      const result = await this.repo.advancedSearchAggregate(params);
      // eslint-disable-next-line no-console
      console.log('[ProductsService.advancedSearchAggregate] success count=', Array.isArray(result) ? result.length : 0);
      return result;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsService.advancedSearchAggregate] error', err);
      throw err;
    }
  }
}
