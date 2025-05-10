import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { IProductService } from './interfaces/product.service.interface';
import { Product } from './entities/product.entity';
import { IProductRepository } from './repositories/product.repository';
import { QueryOptionsDto } from 'src/utils/query-options.dto';
import { Types } from 'mongoose';

@Injectable()
export class ProductsService implements IProductService {
  constructor(@Inject('ProductRepository') private readonly productRepository: IProductRepository) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const productData = {
      ...createProductDto,
      companyId: new Types.ObjectId(createProductDto.companyId),
      categories: createProductDto.categories?.map(id => new Types.ObjectId(id)) || [],
    };
    return this.productRepository.create(productData);
  }

  async findAll(options: QueryOptionsDto): Promise<Product[]> {
    const queryOptions: QueryOptionsDto = {
      ...options,
      populate: ['companyId', 'categories'],
    };
    return this.productRepository.findAll(queryOptions);
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne(id, ['companyId', 'categories']);
    if (!product) {
      throw new NotFoundException(`محصول با شناسه ${id} یافت نشد`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const updateData = {
      ...updateProductDto,
      companyId: updateProductDto.companyId ? new Types.ObjectId(updateProductDto.companyId) : undefined,
      categories: updateProductDto.categories?.map(id => new Types.ObjectId(id)),
    };
    const updatedProduct = await this.productRepository.update(id, updateData);
    if (!updatedProduct) {
      throw new NotFoundException(`محصول با شناسه ${id} یافت نشد`);
    }
    return updatedProduct;
  }

  async remove(id: string): Promise<boolean> {
    const removed = await this.productRepository.delete(id);
    if (!removed) {
      throw new NotFoundException(`محصول با شناسه ${id} یافت نشد`);
    }
    return removed;
  }
}