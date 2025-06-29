import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindManyOptions } from 'src/libs/repository/interfaces/base-repo-options.interface';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  findAll(@Query('limit') limit?: string, @Query('page') page?: string) {
    const options: FindManyOptions = {};

    if (limit) {
      options.perPage = parseInt(limit, 10);
    }
    if (page) {
      options.page = parseInt(page, 10);
    }

    return this.productsService.findAll(options);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Get('count/category/:categoryId')
  countByCategory(@Param('categoryId') categoryId: string) {
    return this.productsService.countByCategory(categoryId);
  }

  @Get('top-sales')
  getTopProducts(@Query('limit') limit?: string) {
    const lim = limit ? parseInt(limit, 10) : 5;
    return this.productsService.getTopProductsBySales(lim);
  }
}
