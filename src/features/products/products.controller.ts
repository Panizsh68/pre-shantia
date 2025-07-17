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
  Inject,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindManyOptions } from 'src/libs/repository/interfaces/base-repo-options.interface';
import { IProductService } from './interfaces/product.service.interface';
import { AuthenticationGuard } from 'src/features/auth/guards/auth.guard';
import { PermissionsGuard } from 'src/features/permissions/guard/permission.guard';
import { Permission } from 'src/features/permissions/decoratorss/permissions.decorators';
import { Resource } from 'src/features/permissions/enums/resources.enum';
import { Action } from 'src/features/permissions/enums/actions.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(@Inject('IProductsService') private readonly productsService: IProductService) { }

  @Post()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.PRODUCTS, Action.CREATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  create(@Body() dto: CreateProductDto, @CurrentUser() user: any) {
    return this.productsService.create(dto, user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get a paginated list of products' })
  @ApiQuery({ name: 'limit', required: false, type: String, example: '10' })
  @ApiQuery({ name: 'page', required: false, type: String, example: '2' })
  @ApiResponse({ status: 200, description: 'List of products returned' })
  findAll(@Query('limit') limit?: string, @Query('page') page?: string) {
    const options: FindManyOptions = {};
    if (limit) options.perPage = parseInt(limit, 10);
    if (page) options.page = parseInt(page, 10);
    return this.productsService.findAll(options);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.PRODUCTS, Action.UPDATE)
  @ApiOperation({ summary: 'Update product by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({ status: 200, description: 'Product updated' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @CurrentUser() user: any) {
    return this.productsService.update(id, dto, user?.id);
  }

  @Delete(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.PRODUCTS, Action.DELETE)
  @ApiOperation({ summary: 'Delete product by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productsService.remove(id, user?.id);
  }

  @Get('count/category/:categoryId')
  @ApiOperation({ summary: 'Count products by category ID' })
  @ApiParam({ name: 'categoryId', type: String })
  @ApiResponse({ status: 200, description: 'Number of products returned' })
  countByCategory(@Param('categoryId') categoryId: string) {
    return this.productsService.countByCategory(categoryId);
  }

  @Get('top-sales')
  @ApiOperation({ summary: 'Get top-selling products' })
  @ApiQuery({ name: 'limit', required: false, type: String, example: '5' })
  @ApiResponse({ status: 200, description: 'Top products returned' })
  getTopProducts(@Query('limit') limit?: string) {
    const lim = limit ? parseInt(limit, 10) : 5;
    return this.productsService.getTopProductsBySales(lim);
  }
}
