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
  BadRequestException,
} from '@nestjs/common';
import { SortOrder } from 'src/libs/repository/interfaces/base-repo-options.interface';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindManyOptions } from 'src/libs/repository/interfaces/base-repo-options.interface';
import { IProductService } from './interfaces/product.service.interface';
import { AuthenticationGuard } from 'src/features/auth/guards/auth.guard';
import { PermissionsGuard } from 'src/features/permissions/guard/permission.guard';
import { Permission } from 'src/features/permissions/decorators/permissions.decorators';
import { Resource } from 'src/features/permissions/enums/resources.enum';
import { Action } from 'src/features/permissions/enums/actions.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { TokenPayload } from 'src/features/auth/interfaces/token-payload.interface';
import { RequestContext } from 'src/common/decorators/request-context.decorator';
import { RequestContext as IRequestContext } from 'src/common/types/request-context.interface';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  @Get('advanced-search')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.PRODUCTS, Action.READ)
  @ApiOperation({ summary: 'Advanced search for products with multiple filters', description: 'This route is open for default users.' })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'companyName', required: false, type: String })
  @ApiQuery({ name: 'categoryIds', required: false, type: [String] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Advanced search results returned' })
  async advancedSearch(
    @Query('query') query?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('companyName') companyName?: string,
    @Query('categoryIds') categoryIds?: string[],
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    const params: Record<string, unknown> = {};
    if (query) params.query = query;
    if (maxPrice !== undefined) {
      const parsedMaxPrice = parseFloat(maxPrice);
      if (isNaN(parsedMaxPrice) || parsedMaxPrice < 0) throw new BadRequestException('maxPrice must be a non-negative number');
      params.maxPrice = parsedMaxPrice;
    }
    if (companyName) params.companyName = companyName;
    if (categoryIds) params.categoryIds = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
    if (page !== undefined) {
      const parsedPage = parseInt(page, 10);
      if (isNaN(parsedPage) || parsedPage < 1) throw new BadRequestException('Page must be a positive integer');
      params.page = parsedPage;
    }
    if (limit !== undefined) {
      const parsedLimit = parseInt(limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) throw new BadRequestException('Limit must be a positive integer');
      params.limit = parsedLimit;
    }
    if (sort) params.sort = sort;
    return this.productsService.advancedSearchAggregate(params);
  }

  constructor(
    @Inject('IProductsService')
    private readonly productsService: IProductService,
  ) { }

  @Get('search-by-price-company')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.PRODUCTS, Action.READ)
  @ApiOperation({ summary: 'Search products by max price and company name' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, example: 500000 })
  @ApiQuery({ name: 'companyName', required: false, type: String, example: 'Nike' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'sort', required: false, type: String, example: 'basePrice:desc' })
  @ApiResponse({ status: 200, description: 'Search results returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async searchByPriceAndCompany(
    @Query('maxPrice') maxPrice?: string,
    @Query('companyName') companyName?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('sort') sort?: string,
  ) {
    const options: FindManyOptions = {};
    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        throw new BadRequestException('Limit must be a positive integer');
      }
      options.perPage = parsedLimit;
    }
    if (page) {
      const parsedPage = parseInt(page, 10);
      if (isNaN(parsedPage) || parsedPage < 1) {
        throw new BadRequestException('Page must be a positive integer');
      }
      options.page = parsedPage;
    }
    if (sort) {
      // Example: 'basePrice:desc' or 'name:asc'
      const [field, order] = sort.split(':');
      if (!field || !order || !['asc', 'desc'].includes(order.toLowerCase())) {
        throw new BadRequestException('Sort must be in format field:asc|desc');
      }
      options.sort = [{ field, order: order.toLowerCase() === 'asc' ? SortOrder.ASC : SortOrder.DESC }];
    }
    let max: number | undefined = undefined;
    if (maxPrice !== undefined) {
      max = parseInt(maxPrice, 10);
      if (isNaN(max) || max < 0) {
        throw new BadRequestException('maxPrice must be a non-negative number');
      }
    }
    return this.productsService.searchByPriceAndCompany({ maxPrice: max, companyName }, options);
  }

  @Get('search')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.PRODUCTS, Action.READ)
  @ApiOperation({ summary: 'Search products by name, company, or category' })
  @ApiQuery({ name: 'query', required: true, type: String, example: 'کفش' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Search results returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async searchProducts(
    @Query('query') query: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    if (!query || typeof query !== 'string' || !query.trim()) {
      throw new BadRequestException('Query parameter is required');
    }
    const options: FindManyOptions = {};
    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        throw new BadRequestException('Limit must be a positive integer');
      }
      options.perPage = parsedLimit;
    }
    if (page) {
      const parsedPage = parseInt(page, 10);
      if (isNaN(parsedPage) || parsedPage < 1) {
        throw new BadRequestException('Page must be a positive integer');
      }
      options.page = parsedPage;
    }
    return this.productsService.searchProducts(query, options);
  }

  @Post()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.PRODUCTS, Action.CREATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product', description: 'Creates a product for the company associated with the authenticated user. Do NOT include companyId in the request body — it is resolved from the user\'s profile on the server.' })
  @ApiBody({ type: CreateProductDto, description: 'Product create payload. companyId is resolved server-side from the authenticated user.' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: TokenPayload,
    @RequestContext() ctx: IRequestContext,
  ) {
    // Pass full user payload to allow permission checks inside service
    return this.productsService.create(dto, user.userId, user as TokenPayload);
  }

  @Get()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.PRODUCTS, Action.READ)
  @ApiOperation({ summary: 'Get a paginated list of products' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'List of products returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    const options: FindManyOptions = {};
    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        throw new BadRequestException('Limit must be a positive integer');
      }
      options.perPage = parsedLimit;
    }
    if (page) {
      const parsedPage = parseInt(page, 10);
      if (isNaN(parsedPage) || parsedPage < 1) {
        throw new BadRequestException('Page must be a positive integer');
      }
      options.page = parsedPage;
    }
    return this.productsService.findAll(options);
  }

  @Get('company/:companyId')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.PRODUCTS, Action.READ)
  @ApiOperation({ summary: 'Get products by company ID' })
  @ApiParam({ name: 'companyId', type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'sort', required: false, type: String, example: 'basePrice:desc' })
  async findByCompanyId(
    @Param('companyId') companyId: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('sort') sort?: string,
  ) {
    const options: FindManyOptions = {};
    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) throw new BadRequestException('Limit must be a positive integer');
      options.perPage = parsedLimit;
    }
    if (page) {
      const parsedPage = parseInt(page, 10);
      if (isNaN(parsedPage) || parsedPage < 1) throw new BadRequestException('Page must be a positive integer');
      options.page = parsedPage;
    }
    if (sort) {
      const [field, order] = sort.split(':');
      if (!field || !order || !['asc', 'desc'].includes(order.toLowerCase())) throw new BadRequestException('Sort must be in format field:asc|desc');
      options.sort = [{ field, order: order.toLowerCase() === 'asc' ? SortOrder.ASC : SortOrder.DESC }];
    }
    return this.productsService.findByCompanyId(companyId, options);
  }

  @Get(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.PRODUCTS, Action.READ)
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.PRODUCTS, Action.UPDATE)
  @ApiOperation({ summary: 'Update product by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Product ID' })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({ status: 200, description: 'Product updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.productsService.update(id, dto, user.userId);
  }

  @Delete(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.PRODUCTS, Action.DELETE)
  @ApiOperation({ summary: 'Delete product by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Product ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204, description: 'Product deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: TokenPayload,
  ) {
    await this.productsService.remove(id, user.userId);
  }

  @Get('count/category/:categoryId')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.PRODUCTS, Action.READ)
  @ApiOperation({ summary: 'Count products by category ID' })
  @ApiParam({ name: 'categoryId', type: String, description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Number of products returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  countByCategory(@Param('categoryId') categoryId: string) {
    return this.productsService.countByCategory(categoryId);
  }

  @Get('top-sales')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.PRODUCTS, Action.READ)
  @ApiOperation({ summary: 'Get top-selling products' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
  @ApiResponse({ status: 200, description: 'Top products returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getTopProducts(@Query('limit') limit?: string) {
    const lim = limit ? parseInt(limit, 10) : 5;
    if (isNaN(lim) || lim < 1) {
      throw new BadRequestException('Limit must be a positive integer');
    }
    return this.productsService.getTopProductsByRating(lim);
  }

  @Get('exists/name/:name')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.PRODUCTS, Action.READ)
  @ApiOperation({ summary: 'Check if a product exists by name' })
  @ApiParam({ name: 'name', type: String, description: 'Product name' })
  @ApiResponse({ status: 200, description: 'Existence result' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async existsByName(@Param('name') name: string) {
    return { exists: await this.productsService.existsByName(name) };
  }

  @Get('count')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.PRODUCTS, Action.READ)
  @ApiOperation({ summary: 'Get total number of products' })
  @ApiResponse({ status: 200, description: 'Total count returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async count() {
    return { count: await this.productsService.count() };
  }
}