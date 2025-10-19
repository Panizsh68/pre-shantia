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

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { ProductStatusResponseDto } from './dto/product-status-response.dto';
import { CountDto, ExistsDto, TopProductDto } from './dto/misc-response.dto';
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
    // eslint-disable-next-line no-console
    console.log('[ProductsController.advancedSearch] entry', { query, maxPrice, companyName, categoryIds, page, limit, sort });
    const params: Record<string, unknown> = {};
    if (query) { params.query = query; }
    if (maxPrice !== undefined) {
      const parsedMaxPrice = parseFloat(maxPrice);
      if (isNaN(parsedMaxPrice) || parsedMaxPrice < 0) { throw new BadRequestException('maxPrice must be a non-negative number'); }
      params.maxPrice = parsedMaxPrice;
    }
    if (companyName) { params.companyName = companyName; }
    if (categoryIds) { params.categoryIds = Array.isArray(categoryIds) ? categoryIds : [categoryIds]; }
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
      // eslint-disable-next-line no-console
      console.log('[ProductsController.advancedSearch] success count=', Array.isArray(result) ? result.length : 0);
      return result;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsController.advancedSearch] error', err);
      throw err;
    }
  }

  constructor(
    @Inject('IProductsService')
    private readonly productsService: IProductService,
  ) { }

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
    // eslint-disable-next-line no-console
    console.log('[ProductsController.searchByPriceAndCompany] entry', { maxPrice, companyName, limit, page, sort });
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
      // eslint-disable-next-line no-console
      console.log('[ProductsController.searchByPriceAndCompany] success count=', Array.isArray(result) ? result.length : 0);
      return result;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsController.searchByPriceAndCompany] error', err);
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
    // eslint-disable-next-line no-console
    console.log('[ProductsController.searchProducts] entry', { query, limit, page });
    if (!query || typeof query !== 'string' || !query.trim()) {
      // eslint-disable-next-line no-console
      console.error('[ProductsController.searchProducts] bad request missing query');
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
      // eslint-disable-next-line no-console
      console.log('[ProductsController.searchProducts] success count=', Array.isArray(result) ? result.length : 0);
      return result;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsController.searchProducts] error', err);
      throw err;
    }
  }

  @Post()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
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
    // eslint-disable-next-line no-console
    console.log('[ProductsController.create] entry userId=', user?.userId, 'dtoKeys=', Object.keys(dto || {}).join(','));
    try {
      const result = this.productsService.create(dto, user.userId, user as TokenPayload);
      // Note: result may be a Promise; controller can return it directly. Log after resolution if needed inside service.
      // eslint-disable-next-line no-console
      console.log('[ProductsController.create] forwarded to service');
      return result;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsController.create] error', err);
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
    // eslint-disable-next-line no-console
    console.log('[ProductsController.findAll] entry', { limit, page });
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
      // eslint-disable-next-line no-console
      console.log('[ProductsController.findAll] forwarded to service');
      return result;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsController.findAll] error', err);
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
    // eslint-disable-next-line no-console
    console.log('[ProductsController.findByCompanyId] entry', { companyId, limit, page, sort });
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
      // eslint-disable-next-line no-console
      console.log('[ProductsController.findByCompanyId] success count=', Array.isArray(result) ? result.length : 0);
      return result;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsController.findByCompanyId] error', err);
      throw err;
    }
  }



  @Get('top-sales')
  @ApiOperation({ summary: 'Get top-selling products' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
  @ApiResponse({ status: 200, description: 'Top products returned', type: [TopProductDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getTopProducts(@Query('limit') limit?: string) {
    // eslint-disable-next-line no-console
    console.log('[ProductsController.getTopProducts] entry limit=', limit);
    const lim = limit ? parseInt(limit, 10) : 5;
    if (isNaN(lim) || lim < 1) {
      // eslint-disable-next-line no-console
      console.error('[ProductsController.getTopProducts] bad request invalid limit=', limit);
      throw new BadRequestException('Limit must be a positive integer');
    }
    try {
      const result = this.productsService.getTopProductsByRating(lim);
      // eslint-disable-next-line no-console
      console.log('[ProductsController.getTopProducts] forwarded to service limit=', lim);
      return result;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsController.getTopProducts] error', err);
      throw err;
    }
  }

  @Get('offers')
  @ApiOperation({ summary: 'Get products that currently have a discount (offers)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'List of offer products returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOffers(
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    // eslint-disable-next-line no-console
    console.log('[ProductsController.getOffers] entry', { limit, page });
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
      // eslint-disable-next-line no-console
      console.log('[ProductsController.getOffers] success count=', Array.isArray(result) ? result.length : 0);
      return result;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsController.getOffers] error', err);
      throw err;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product found', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    // eslint-disable-next-line no-console
    console.log('[ProductsController.findOne] entry id=', id);
    try {
      const result = this.productsService.findOne(id);
      // eslint-disable-next-line no-console
      console.log('[ProductsController.findOne] forwarded to service id=', id);
      return result;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsController.findOne] error', err);
      throw err;
    }
  }

  @Patch(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
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
    // eslint-disable-next-line no-console
    console.log('[ProductsController.update] entry id=', id, 'userId=', user?.userId, 'dtoKeys=', Object.keys(dto || {}).join(','));
    try {
      const result = this.productsService.transactionalUpdate(id, dto, user.userId, user as TokenPayload);
      // eslint-disable-next-line no-console
      console.log('[ProductsController.update] forwarded to service id=', id);
      return result;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsController.update] error', err);
      throw err;
    }
  }

  @Patch(':id/status')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
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
    // eslint-disable-next-line no-console
    console.log('[ProductsController.updateStatus] entry id=', id, 'userId=', user?.userId, 'status=', dto?.status);
    try {
      const updated = await this.productsService.updateStatus(id, dto.status, user.userId);
      // eslint-disable-next-line no-console
      console.log('[ProductsController.updateStatus] success id=', id, 'status=', dto.status);
      return updated;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsController.updateStatus] error', err);
      throw err;
    }
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
    // eslint-disable-next-line no-console
    console.log('[ProductsController.remove] entry id=', id, 'userId=', user?.userId);
    try {
      const result = await this.productsService.transactionalRemove(id, user.userId, user as TokenPayload);
      // eslint-disable-next-line no-console
      console.log('[ProductsController.remove] success id=', id);
      return result;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsController.remove] error', err);
      throw err;
    }
  }

  @Get('count/category/:categoryId')
  @ApiOperation({ summary: 'Count products by category ID' })
  @ApiParam({ name: 'categoryId', type: String, description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Number of products returned', type: CountDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  countByCategory(@Param('categoryId') categoryId: string) {
    // eslint-disable-next-line no-console
    console.log('[ProductsController.countByCategory] entry categoryId=', categoryId);
    try {
      const result = this.productsService.countByCategory(categoryId);
      // eslint-disable-next-line no-console
      console.log('[ProductsController.countByCategory] forwarded to service');
      return result;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsController.countByCategory] error', err);
      throw err;
    }
  }




  @Get('exists/name/:name')
  @ApiOperation({ summary: 'Check if a product exists by name' })
  @ApiParam({ name: 'name', type: String, description: 'Product name' })
  @ApiResponse({ status: 200, description: 'Existence result', type: ExistsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async existsByName(@Param('name') name: string) {
    // eslint-disable-next-line no-console
    console.log('[ProductsController.existsByName] entry name=', name);
    try {
      const exists = await this.productsService.existsByName(name);
      // eslint-disable-next-line no-console
      console.log('[ProductsController.existsByName] result=', exists);
      return { exists };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsController.existsByName] error', err);
      throw err;
    }
  }

  @Get('count')
  @ApiOperation({ summary: 'Get total number of products' })
  @ApiResponse({ status: 200, description: 'Total count returned', type: CountDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async count() {
    // eslint-disable-next-line no-console
    console.log('[ProductsController.count] entry');
    try {
      const count = await this.productsService.count();
      // eslint-disable-next-line no-console
      console.log('[ProductsController.count] result=', count);
      return { count };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProductsController.count] error', err);
      throw err;
    }
  }
}