import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { AuthenticationGuard } from 'src/features/users/auth/guards/auth.guard';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './entities/product.entity';

@Module({
  imports: [MongooseModule.forFeature([{name: Product.name, schema: ProductSchema}])],
  controllers: [ProductsController],
  providers: [ProductsService, AuthenticationGuard, JwtService, TokensService],
})
export class ProductsModule {}
