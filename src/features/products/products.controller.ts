import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UsePipes } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthenticationGuard } from 'src/features/users/auth/guards/auth.guard';
import { RequestContextPipe } from 'src/utils/pipes/request-context.pipe';
import { PermissionsGuard } from 'src/features/users/auth/guards/permission.guard';
import { Permissions } from 'src/features/users/auth/decorators/permissions.decorator';
import { Action } from 'src/features/users/auth/enums/actions.enum';
import { Resource } from 'src/features/users/auth/enums/resources.enum';
import { IProductService } from './interfaces/product.service.interface';
import { UpdateResult, DeleteResult } from 'mongoose';
import { Product } from './entities/product.entity';

@Controller('products')
export class ProductsController implements IProductService {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UsePipes(RequestContextPipe)
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permissions([{ action: Action.create, resource: Resource.products }])
  create(@Body() createProductDto: CreateProductDto): Promise<Product>  {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll(): Promise<Product[]>  {
    return this.productsService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<Product | null>  {
    return this.productsService.findById(id);
  }

  @Patch(':id')
  @UsePipes(RequestContextPipe)
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permissions([{ action: Action.update, resource: Resource.products }])
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto): Promise<Product | null>  {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UsePipes(RequestContextPipe)
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permissions([{ action: Action.delete, resource: Resource.products }])
  remove(@Param('id') id: string): Promise<boolean>  {
    return this.productsService.remove(id);
  }
}
