import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { IProductService } from './interfaces/product.service.interface';
import { UpdateResult, DeleteResult, Model } from 'mongoose';
import { Product } from './entities/product.entity';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class ProductsService implements IProductService{
  constructor(@InjectModel(Product.name) private readonly productModel: Model<Product> ) {}

  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    const product = await this.productModel.create(createProductDto)
    return await product.save()
  }
  async findAllProducts(): Promise<Product[]> {
    const products = await this.productModel.find()
    return products
  }
  async findOneProduct(id: string): Promise<Product> {
    const product = await this.productModel.findById(id)
    if (!product) throw new NotFoundException('product not found')
    return product
  }
  async updateProduct(id: string, updateProductDto: UpdateProductDto): Promise<UpdateResult> {
    const updatedProduct = await this.productModel.updateOne({ _id: id}, updateProductDto)
    return updatedProduct
  }
  async removeProduct(id: string): Promise<DeleteResult> {
    const removedProduct = await this.productModel.deleteOne({ _id: id })
    return removedProduct
  }

}
