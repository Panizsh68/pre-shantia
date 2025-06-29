import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { AuthenticationGuard } from 'src/features/auth/guards/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './entities/product.entity';
import { Model } from 'mongoose';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';
import { IBaseCrudRepository } from 'src/libs/repository/interfaces/base-repo.interfaces';
import { IProductRepository, ProductRepository } from './repositories/product.repository';
import { CachingService } from 'src/infrastructure/caching/caching.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    {
      provide: 'ProductRepository',
      useFactory: (productModel: Model<Product>): IProductRepository => {
        return new ProductRepository(productModel);
      },
      inject: [getModelToken(Product.name)],
    },
    {
      provide: 'IProductsService',
      useClass: ProductsService,
    },
    ProductsService,
    AuthenticationGuard,
    JwtService,
    TokensService,
    CachingService,
  ],
  exports: ['IProductsService', 'ProductRepository'],
})
export class ProductsModule {}
