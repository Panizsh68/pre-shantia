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
  ForbiddenException,
  Header,
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
import { Types } from 'mongoose';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { ProductStatusResponseDto } from './dto/product-status-response.dto';
import { CountDto, ExistsDto } from './dto/misc-response.dto';
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
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  

  constructor(
    @Inject('IProductsService')
    private readonly productsService: IProductService,
  ) { }

  @Get('advanced-search')
  @ApiOperation({
    summary: 'Advanced search for products with multiple filters',
    description: 'Returns ACTIVE products. All filters are query params (no request body).',
  })
  @ApiQuery({
    name: 'query',
    required: false,
    type: String,
    description: 'Case-insensitive search on product name.',
    example: 'laptop',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
    description: 'Minimum basePrice (>= 0).',
    example: 100,
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    description: 'Maximum basePrice (>= 0).',
    example: 1500,
  })
  @ApiQuery({
    name: 'companyName',
    required: false,
    type: String,
    description: 'Case-insensitive match on company name.',
    example: 'Apple',
  })
  @ApiQuery({
    name: 'categoryIds',
    required: false,
    type: String,
    isArray: true,
    description: 'Array of Category ObjectId strings. Send as repeated query params: ?categoryIds=...&categoryIds=...',
    example: ['66cf2f0c4f1a9b1234567890', '66cf2f0c4f1a9b1234567891'],
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (>= 1). Defaults to 1.',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (>= 1). Defaults to 10.',
    example: 20,
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description: 'Sort format: field:asc|desc. Defaults to createdAt:desc when omitted.',
    example: 'basePrice:asc',
  })
  @ApiResponse({ status: 200, description: 'Advanced search results returned', type: ProductResponseDto, isArray: true })
  async advancedSearch(
    @Query('query') query?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('companyName') companyName?: string,
    @Query('categoryIds') categoryIds?: string[],
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    const params: Record<string, unknown> = {};
    if (query) { params.query = query; }
    if (minPrice !== undefined) {
      const parsedMinPrice = parseFloat(minPrice);
      if (isNaN(parsedMinPrice) || parsedMinPrice < 0) { throw new BadRequestException('minPrice must be a non-negative number'); }
      params.minPrice = parsedMinPrice;
    }
    if (maxPrice !== undefined) {
      const parsedMaxPrice = parseFloat(maxPrice);
      if (isNaN(parsedMaxPrice) || parsedMaxPrice < 0) { throw new BadRequestException('maxPrice must be a non-negative number'); }
      params.maxPrice = parsedMaxPrice;
    }
    if (params.minPrice !== undefined && params.maxPrice !== undefined && (params.minPrice as number) > (params.maxPrice as number)) {
      throw new BadRequestException('minPrice cannot be greater than maxPrice');
    }
    if (companyName) { params.companyName = companyName; }
    if (categoryIds) {
      const normalizedCategoryIds = [...new Set(Array.isArray(categoryIds) ? categoryIds : [categoryIds])]
        .map((id) => id.trim())
        .filter(Boolean);
      if (normalizedCategoryIds.some((id) => !Types.ObjectId.isValid(id))) {
        throw new BadRequestException('categoryIds شامل شناسه دسته‌بندی نامعتبر است.');
      }
      params.categoryIds = normalizedCategoryIds;
    }
    if (page !== undefined) {
      const parsedPage = parseInt(page, 10);
      if (isNaN(parsedPage) || parsedPage < 1) { throw new BadRequestException('Page must be a positive integer'); }
      params.page = parsedPage;
    }
    if (limit !== undefined) {
      const parsedLimit = parseInt(limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) { throw new BadRequestException('Limit must be a positive integer'); }
      params.limit = parsedLimit;
    }
    if (sort) { params.sort = sort; }
    try {
      const result = await this.productsService.advancedSearchAggregate(params);
      return result;
    } catch (err) {
      throw err;
    }
  }
  
  @Get('search-by-price-company')
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
    try {
      const result = await this.productsService.searchByPriceAndCompany({ maxPrice: max, companyName }, options);
      return result;
    } catch (err) {
      throw err;
    }
  }

  @Get('search')
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
    try {
      const result = await this.productsService.searchProducts(query, options);
      return result;
    } catch (err) {
      throw err;
    }
  }

  @Post()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permission(Resource.PRODUCTS, Action.CREATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product', description: 'Creates a product for the company associated with the authenticated user. Do NOT include companyId in the request body — it is resolved from the user\'s profile on the server.' })
  @ApiBody({ type: CreateProductDto, description: 'Product create payload. companyId is resolved server-side from the authenticated user.' })
  @ApiResponse({ status: 201, description: 'Product created successfully', type: ProductResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: TokenPayload,
    @RequestContext() ctx: IRequestContext,
  ) {
    try {
      const result = this.productsService.create(dto, user.userId, user as TokenPayload);
      return result;
    } catch (err) {
      throw err;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get a paginated list of products' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'List of products returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Header('Cache-Control', 'public, max-age=300')
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
    try {
      const result = this.productsService.findAll(options);
      return result;
    } catch (err) {
      throw err;
    }
  }

  @Get('admin/all-products')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permission(Resource.PRODUCTS, Action.READ)
  @ApiOperation({
    summary: 'Get all products (all statuses) for admin/editor',
    description: 'Retrieves all products including ACTIVE, DRAFT, DELETED, etc. Only accessible to users with CREATE or UPDATE permission on PRODUCTS.'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'sort', required: false, type: String, example: 'createdAt:desc' })
  @ApiQuery({ name: 'filter', required: false, type: String, description: 'Search by product name, slug, or SKU' })
  @ApiResponse({ status: 200, description: 'List of all products returned (all statuses)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async findAllForAdmin(
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('sort') sort?: string,
    @Query('filter') filter?: string,
    @CurrentUser() user?: TokenPayload,
  ) {
    // The route guard checks READ; this explicit check also supports editors.
    const hasPermission = user?.permissions?.some(p =>
      (p.resource === Resource.ALL && p.actions.includes(Action.MANAGE)) ||
      (p.resource === Resource.PRODUCTS &&
        (p.actions.includes(Action.READ) || p.actions.includes(Action.CREATE) || p.actions.includes(Action.UPDATE)))
    );
    if (!hasPermission) {
      throw new ForbiddenException('برای مشاهده محصولات مجوز کافی ندارید.');
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
    if (sort) {
      const [field, order] = sort.split(':');
      if (!field || !order || !['asc', 'desc'].includes(order.toLowerCase())) {
        throw new BadRequestException('Sort must be in format field:asc|desc');
      }
      options.sort = [{ field, order: order.toLowerCase() === 'asc' ? SortOrder.ASC : SortOrder.DESC }];
    }
    if (filter?.trim()) {
      const escapedFilter = filter.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      options.conditions = {
        $or: [
          { name: { $regex: escapedFilter, $options: 'i' } },
          { slug: { $regex: escapedFilter, $options: 'i' } },
          { sku: { $regex: escapedFilter, $options: 'i' } },
        ],
      };
    }
    try {
      const result = await this.productsService.findAllForAdminPage(options);
      return result;
    } catch (err) {
      throw err;
    }
  }

  @Get('company/:companyId')
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
      if (isNaN(parsedLimit) || parsedLimit < 1) { throw new BadRequestException('Limit must be a positive integer'); }
      options.perPage = parsedLimit;
    }
    if (page) {
      const parsedPage = parseInt(page, 10);
      if (isNaN(parsedPage) || parsedPage < 1) { throw new BadRequestException('Page must be a positive integer'); }
      options.page = parsedPage;
    }
    if (sort) {
      const [field, order] = sort.split(':');
      if (!field || !order || !['asc', 'desc'].includes(order.toLowerCase())) { throw new BadRequestException('Sort must be in format field:asc|desc'); }
      options.sort = [{ field, order: order.toLowerCase() === 'asc' ? SortOrder.ASC : SortOrder.DESC }];
    }
    try {
      const result = await this.productsService.findByCompanyId(companyId, options);
      return result;
    } catch (err) {
      throw err;
    }
  }



  @Get('top-sales')
  @ApiOperation({ summary: 'Get top-rated products' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
  @ApiResponse({ status: 200, description: 'Top products returned', type: [ProductResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTopProducts(@Query('limit') limit?: string) {
    const lim = limit ? parseInt(limit, 10) : 5;
    if (isNaN(lim) || lim < 1) {
      throw new BadRequestException('Limit must be a positive integer');
    }
    try {
      const result = await this.productsService.getTopProductsByRating(lim);
      return result;
    } catch (err) {
      throw err;
    }
  }

  @Get('offers')
  @Public()
  @ApiOperation({ summary: 'Get products that currently have a discount (offers)', security: [] })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'List of offer products returned' })
  async getOffers(
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    const options: FindManyOptions = {};
    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) { throw new BadRequestException('Limit must be a positive integer'); }
      options.perPage = parsedLimit;
    }
    if (page) {
      const parsedPage = parseInt(page, 10);
      if (isNaN(parsedPage) || parsedPage < 1) { throw new BadRequestException('Page must be a positive integer'); }
      options.page = parsedPage;
    }
    try {
      const result = await this.productsService.getOffers(options);
      return result;
    } catch (err) {
      throw err;
    }
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get product by ID', security: [] })
  @ApiParam({ name: 'id', type: String, description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product found', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id') id: string) {
    try {
      const result = this.productsService.findOne(id);
      return result;
    } catch (err) {
      throw err;
    }
  }

  @Patch(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permission(Resource.PRODUCTS, Action.UPDATE)
  @ApiOperation({ summary: 'Update product by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Product ID' })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({ status: 200, description: 'Product updated', type: ProductResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: TokenPayload,
  ) {
    try {
      const result = this.productsService.transactionalUpdate(id, dto, user.userId, user as TokenPayload);
      return result;
    } catch (err) {
      throw err;
    }
  }

  @Patch(':id/status')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permission(Resource.PRODUCT_STATUS, Action.UPDATE)
  @ApiOperation({ summary: 'Update only the status of a product' })
  @ApiParam({ name: 'id', type: String, description: 'Product ID' })
  @ApiBody({ type: UpdateProductStatusDto })
  @ApiResponse({ status: 200, description: 'Product status updated', type: ProductStatusResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateProductStatusDto,
    @CurrentUser() user: TokenPayload,
  ) {
    try {
      const updated = await this.productsService.updateStatus(id, dto.status, user.userId, user);
      return updated;
    } catch (err) {
      throw err;
    }
  }

  @Delete(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @ApiBearerAuth()
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
    try {
      const result = await this.productsService.transactionalRemove(id, user.userId, user as TokenPayload);
      return result;
    } catch (err) {
      throw err;
    }
  }

  @Get('count/category/:categoryId')
  @ApiOperation({ summary: 'Count products by category ID' })
  @ApiParam({ name: 'categoryId', type: String, description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Number of products returned', type: CountDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  countByCategory(@Param('categoryId') categoryId: string) {
    try {
      const result = this.productsService.countByCategory(categoryId);
      return result;
    } catch (err) {
      throw err;
    }
  }




  @Get('exists/name/:name')
  @ApiOperation({ summary: 'Check if a product exists by name' })
  @ApiParam({ name: 'name', type: String, description: 'Product name' })
  @ApiResponse({ status: 200, description: 'Existence result', type: ExistsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async existsByName(@Param('name') name: string) {
    try {
      const exists = await this.productsService.existsByName(name);
      return { exists };
    } catch (err) {
      throw err;
    }
  }

  @Get('count')
  @ApiOperation({ summary: 'Get total number of products' })
  @ApiResponse({ status: 200, description: 'Total count returned', type: CountDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async count() {
    try {
      const count = await this.productsService.count();
      return { count };
    } catch (err) {
      throw err;
    }
  }
}
