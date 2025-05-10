import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { AuthenticationGuard } from 'src/features/users/auth/guards/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './entities/product.entity';
import { BaseRepository } from 'src/utils/base.repository';
import { Model } from 'mongoose';

@Module({
  imports: [MongooseModule.forFeature([{name: Product.name, schema: ProductSchema}])],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    {
      provide: 'ProductRepository',
      useFactory: (productModel: Model<Product>) => 
        new BaseRepository<Product>(productModel),
      inject: [getModelToken(Product.name)],
    },
    ProductsService, AuthenticationGuard, JwtService, TokensService],
})
export class ProductsModule {}
