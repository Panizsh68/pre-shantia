import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Types, ClientSession, PipelineStage } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { IProductService } from './interfaces/product.service.interface';
import { IProductRepository } from './repositories/product.repository';
import { FindManyOptions } from 'src/libs/repository/interfaces/base-repo-options.interface';
import { IProduct } from './interfaces/product.interface';
import { TopProduct } from './interfaces/top-product.interface';
import { RequestContext } from 'src/common/types/request-context.interface';

@Injectable()
export class ProductsService implements IProductService {
  constructor(
    @Inject('ProductRepository')
    private readonly repo: IProductRepository,
  ) {}

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
    const data: Partial<any> = {
      ...rest,
      companyId: this.toObjectId(companyId),
      categories: this.toObjectIdArray(categories),
      createdBy: this.toObjectId(userId),
      updatedBy: this.toObjectId(userId),
    };
    const productDoc = await this.repo.createOne(data, session);
    return productDoc.toObject() as unknown as IProduct;
  }

  async findAll(options: FindManyOptions = {}, session?: ClientSession): Promise<IProduct[]> {
    const queryOptions: FindManyOptions = {
      ...options,
      populate: options.populate || ['companyId', 'categories'],
      session,
    };
    const products = await this.repo.findAll(queryOptions);
    return products.map(doc => doc.toObject() as unknown as IProduct);
  }

  async findOne(id: string, session?: ClientSession): Promise<IProduct> {
    const productDoc = await this.repo.findById(id, { session });
    if (!productDoc) throw new NotFoundException(`Product with id ${id} not found`);
    return productDoc.toObject() as unknown as IProduct;
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
    const data: Partial<any> = {
      ...rest,
      companyId: this.toObjectId(companyId!),
      categories: this.toObjectIdArray(categories),
      updatedBy: this.toObjectId(userId),
    };
    const updatedDoc = await this.repo.updateById(id, data, session);
    return updatedDoc.toObject() as unknown as IProduct;
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

  async getTopProductsBySales(limit = 5, session?: ClientSession): Promise<TopProduct[]> {
    return this.repo.aggregate<TopProduct>([{ $sort: { sales: -1 } }, { $limit: limit }], session);
  }

  async transactionalCreate(
    dto: CreateProductDto,
    userId: string,
    session?: ClientSession,
  ): Promise<IProduct> {
    const txn = session || (await this.repo.startTransaction());
    try {
      const result = await this.create(dto, userId, {} as any, txn);
      if (!session) await this.repo.commitTransaction(txn);
      return result;
    } catch (err) {
      if (!session) await this.repo.abortTransaction(txn);
      throw err;
    }
  }
}
