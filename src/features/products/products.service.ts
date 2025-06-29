import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Types, ClientSession, PipelineStage } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { IProductService } from './interfaces/product.service.interface';
import { Product } from './entities/product.entity';
import { IProductRepository } from './repositories/product.repository';
import { FindManyOptions } from 'src/libs/repository/interfaces/base-repo-options.interface';
import { IProduct } from './interfaces/product.interface';
import { TopProduct } from './interfaces/top-product.interface';

@Injectable()
export class ProductsService implements IProductService {
  constructor(
    @Inject('ProductRepository') private readonly productRepository: IProductRepository,
  ) {}

  async create(createProductDto: CreateProductDto, session?: ClientSession): Promise<IProduct> {
    const productData: CreateProductDto = {
      ...createProductDto,
      companyId: createProductDto.companyId,
      categories: createProductDto.categories?.map(id => id) || [],
    };
    return this.productRepository.createOne(productData, session);
  }

  async findAll(options: FindManyOptions = {}, session?: ClientSession): Promise<IProduct[]> {
    const queryOptions: FindManyOptions = {
      ...options,
      populate: options.populate || ['companyId', 'categories'],
      session,
    };
    return this.productRepository.findAll(queryOptions);
  }

  async findOne(id: string, session?: ClientSession): Promise<Product> {
    const product = await this.productRepository.findById(id, { session });
    if (!product) {
      throw new NotFoundException(`Product with id:${id} not found`);
    }
    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    session?: ClientSession,
  ): Promise<IProduct> {
    const updateData: UpdateProductDto = {
      ...updateProductDto,
      companyId: updateProductDto.companyId,
      categories: updateProductDto.categories?.map(id => id) || [],
    };

    const updatedProduct = await this.productRepository.updateById(id, updateData, session);
    if (!updatedProduct) {
      throw new NotFoundException(`Product with id:${id} not found`);
    }
    return updatedProduct;
  }

  async remove(id: string, session?: ClientSession): Promise<boolean> {
    const removed = await this.productRepository.deleteById(id, session);
    if (!removed) {
      throw new NotFoundException(`Product with id:${id} not found`);
    }
    return removed;
  }

  async existsByCompany(companyId: string, session?: ClientSession): Promise<boolean> {
    return this.productRepository.existsByCondition(
      {
        companyId: new Types.ObjectId(companyId),
      },
      session,
    );
  }

  async countByCategory(categoryId: string, session?: ClientSession): Promise<number> {
    return this.productRepository.countByCondition(
      {
        categories: new Types.ObjectId(categoryId),
      },
      session,
    );
  }

  async getTopProductsBySales(limit = 5, session?: ClientSession): Promise<TopProduct[]> {
    const pipeline: PipelineStage[] = [{ $sort: { sales: -1 } }, { $limit: limit }];
    return this.productRepository.aggregate(pipeline, session);
  }

  async transactionalCreate(
    createProductDto: CreateProductDto,
    session?: ClientSession,
  ): Promise<IProduct> {
    const transactionSession = session || (await this.productRepository.startTransaction());
    try {
      const productData: CreateProductDto = {
        ...createProductDto,
        companyId: createProductDto.companyId,
        categories: createProductDto.categories?.map(id => id) || [],
      };
      const newProduct = await this.productRepository.createOne(productData, session);
      const savedProduct = await this.productRepository.saveOne(newProduct, session);
      if (!session) {
        await this.productRepository.commitTransaction(transactionSession);
      }
      return savedProduct;
    } catch (error) {
      if (!session) {
        await this.productRepository.abortTransaction(transactionSession);
      }
      throw new BadRequestException(`Transaction failed: ${error.message}`);
    }
  }
}
