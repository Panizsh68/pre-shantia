import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { IProductService } from './interfaces/product.service.interface';
import { UpdateResult, DeleteResult, Model } from 'mongoose';
import { Product } from './entities/product.entity';
import { InjectModel } from '@nestjs/mongoose';
import { IProductRepository } from './repositories/product.repository';

@Injectable()
export class ProductsService implements IProductService{
  constructor(@Inject('ProductRepository') private readonly productRepository: IProductRepository) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = await this.productRepository.create(createProductDto)
    return product
  }
  async findAll(): Promise<Product[]> {
    const products = await this.productRepository.findAll()
    return products
  }
  async findById(id: string): Promise<Product | null> {
    const product = await this.productRepository.findById(id)
    return product
  }
  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product | null> {
    const updatedProduct = await this.productRepository.update(id, updateProductDto)
    return updatedProduct
  }
  async remove(id: string): Promise<boolean> {
    const removedProduct = await this.productRepository.delete(id)
    return removedProduct
  }

}
