import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  Inject,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { TokenPayload } from '../auth/interfaces/token-payload.interface';
import { Category } from './entities/category.entity';
import { CategoryStatus } from './enums/category-status.enum';
import { ICategoryService } from './interfaces/category.service.interface';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuthenticationGuard } from '../auth/guards/auth.guard';
import { Permission } from '../permissions/decoratorss/permissions.decorators';
import { PermissionsGuard } from '../permissions/guard/permission.guard';
import { Resource } from '../permissions/enums/resources.enum';
import { Action } from '../permissions/enums/actions.enum';
import { Types } from 'mongoose';
import { FindManyOptions } from 'src/libs/repository/interfaces/base-repo-options.interface';
import { RequestContext } from 'src/common/decorators/request-context.decorator';
import { RequestContext as IRequestContext } from 'src/common/types/request-context.interface';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(
    @Inject('ICategoryService')
    private readonly categoriesService: ICategoryService,
  ) { }

  @Post()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.CATEGORIES, Action.CREATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({ status: 201, description: 'Category created successfully', type: Category })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() dto: CreateCategoryDto,
    @CurrentUser() user: TokenPayload,
    @RequestContext() ctx: IRequestContext,
  ) {
    const categoryData: any = { ...dto, companyId: new Types.ObjectId(user.userId) };
    // اصلاح منطق parentId: اگر رشته خالی یا undefined بود، parentId حذف شود
    if (typeof dto.parentId === 'string' && dto.parentId.trim() === '') {
      categoryData.parentId = undefined;
    } else if (dto.parentId) {
      categoryData.parentId = new Types.ObjectId(dto.parentId);
    }
    return this.categoriesService.create(
      categoryData,
      user.userId,
      ctx,
    );
  }

  @Get()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.CATEGORIES, Action.READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all categories' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'List of categories', type: [Category] })
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
    return this.categoriesService.findAll(options);
  }

  @Get(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.CATEGORIES, Action.READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get category by ID', description: 'This route is open for default users.' })
  @ApiParam({ name: 'id', type: String, description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category found', type: Category })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.CATEGORIES, Action.UPDATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update category by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Category ID' })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({ status: 200, description: 'Category updated', type: Category })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: TokenPayload,
  ) {
    const categoryData: any = { ...dto, companyId: new Types.ObjectId(user.userId) };
    // اصلاح منطق parentId: اگر رشته خالی یا undefined بود، parentId حذف شود
    if (typeof dto.parentId === 'string' && dto.parentId.trim() === '') {
      categoryData.parentId = undefined;
    } else if (dto.parentId) {
      categoryData.parentId = new Types.ObjectId(dto.parentId);
    }
    return this.categoriesService.update(
      id,
      categoryData,
      user.userId,
    );
  }

  @Delete(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.CATEGORIES, Action.DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete category by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Category ID' })
  @ApiResponse({ status: 204, description: 'Category deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: TokenPayload,
  ) {
    await this.categoriesService.remove(id, user.userId);
  }

  @Patch(':id/status')
  @UseGuards(PermissionsGuard)
  @Permission(Resource.CATEGORIES, Action.UPDATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set status for a category' })
  @ApiParam({ name: 'id', type: 'string', description: 'Category ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(CategoryStatus),
          example: CategoryStatus.ACTIVE,
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Category status updated' })
  setStatus(
    @CurrentUser() user: TokenPayload,
    @Param('id') id: string,
    @Body('status') status: CategoryStatus,
  ) {
    return this.categoriesService.setStatus(id, status, user.userId);
  }

  @Get('parent/:parentId')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.CATEGORIES, Action.READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get categories by parent ID' })
  @ApiParam({ name: 'parentId', type: String, description: 'Parent category ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'List of child categories', type: [Category] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findByParentId(
    @Param('parentId') parentId: string,
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
    return this.categoriesService.findByParentId(parentId, options);
  }

  @Get('exists/slug/:slug')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.CATEGORIES, Action.READ)
  @ApiOperation({ summary: 'Check if a category exists by slug' })
  @ApiParam({ name: 'slug', type: String, description: 'Category slug' })
  @ApiResponse({ status: 200, description: 'Existence result' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async existsBySlug(@Param('slug') slug: string) {
    return { exists: await this.categoriesService.existsBySlug(slug) };
  }

  @Get('count')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.CATEGORIES, Action.READ)
  @ApiOperation({ summary: 'Get total number of categories' })
  @ApiResponse({ status: 200, description: 'Total count returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async count() {
    return { count: await this.categoriesService.count() };
  }
}
