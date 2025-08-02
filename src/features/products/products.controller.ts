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
import { Permission } from 'src/features/permissions/decoratorss/permissions.decorators';
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
  constructor(
    @Inject('IProductsService')
    private readonly productsService: IProductService,
  ) {}

  @Post()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.PRODUCTS, Action.CREATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: TokenPayload,
    @RequestContext() ctx: IRequestContext,
  ) {
    return this.productsService.create(dto, user.userId, ctx);
  }

  @Get()
  @UseGuards(AuthenticationGuard)
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

  @Get(':id')
  @UseGuards(AuthenticationGuard)
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
  @UseGuards(AuthenticationGuard)
  @ApiOperation({ summary: 'Count products by category ID' })
  @ApiParam({ name: 'categoryId', type: String, description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Number of products returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  countByCategory(@Param('categoryId') categoryId: string) {
    return this.productsService.countByCategory(categoryId);
  }

  @Get('top-sales')
  @UseGuards(AuthenticationGuard)
  @ApiOperation({ summary: 'Get top-selling products' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
  @ApiResponse({ status: 200, description: 'Top products returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getTopProducts(@Query('limit') limit?: string) {
    const lim = limit ? parseInt(limit, 10) : 5;
    if (isNaN(lim) || lim < 1) {
      throw new BadRequestException('Limit must be a positive integer');
    }
    return this.productsService.getTopProductsBySales(lim);
  }
}
