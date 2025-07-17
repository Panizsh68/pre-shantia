import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { AuthenticationGuard } from 'src/features/auth/guards/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './entities/product.entity';
import { Model } from 'mongoose';
import { IProductRepository, ProductRepository } from './repositories/product.repository';
import { CachingService } from 'src/infrastructure/caching/caching.service';
import { GenericRepositoryModule } from 'src/libs/repository/generic-repository.module';
import {
  BASE_AGGREGATE_REPOSITORY,
  BASE_TRANSACTION_REPOSITORY,
} from 'src/libs/repository/constants/tokens.constants';

@Module({
  imports: [GenericRepositoryModule.forFeature<Product>(Product.name, Product, ProductSchema)],
  controllers: [ProductsController],
  providers: [
    {
      provide: 'ProductRepository',
      useFactory: (productModel, aggregateRepo, transactionRepo): IProductRepository => {
        return new ProductRepository(productModel, aggregateRepo, transactionRepo);
      },
      inject: [getModelToken(Product.name), BASE_AGGREGATE_REPOSITORY, BASE_TRANSACTION_REPOSITORY],
    },
    {
      provide: 'IProductsService',
      useClass: ProductsService,
    },
    AuthenticationGuard,
    JwtService,
    TokensService,
    CachingService,
  ],
  exports: ['IProductsService', 'ProductRepository'],
})
export class ProductsModule {}
