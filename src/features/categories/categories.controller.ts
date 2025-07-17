import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  HttpStatus,
  HttpCode,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { TokenPayload } from '../auth/interfaces/token-payload.interface';
import { Category } from './entities/category.entity';
import { CategoryStatus } from './enums/category-status.enum';
import { ICategoryService } from './interfaces/category.service.interface';
import { AuthenticationGuard } from '../auth/guards/auth.guard';
import { Permission } from '../permissions/decoratorss/permissions.decorators';
import { PermissionsGuard } from '../permissions/guard/permission.guard';
import { Resource } from '../permissions/enums/resources.enum';
import { Action } from '../permissions/enums/actions.enum';
import { Types } from 'mongoose';

@ApiTags('Categories')
@UseGuards(AuthenticationGuard)
@Controller('categories')
export class CategoriesController {
  constructor(
    @Inject('ICategoryService')
    private readonly categoriesService: ICategoryService,
  ) { }

  @Post()
  @UseGuards(PermissionsGuard)
  @Permission(Resource.CATEGORIES, Action.CREATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiBody({ type: Category })
  @ApiResponse({ status: 201, description: 'Category created successfully', type: Category })
  create(@CurrentUser() user: TokenPayload, @Body() data: Partial<Category>) {
    return this.categoriesService.create({ ...data, companyId: new Types.ObjectId(user.userId) }, user.userId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all categories for current user' })
  @ApiResponse({ status: 200, description: 'List of categories', type: [Category] })
  findAll(@CurrentUser() user: TokenPayload) {
    return this.categoriesService.findAll(user.userId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category found', type: Category })
  findOne(@CurrentUser() user: TokenPayload, @Param('id') id: string) {
    return this.categoriesService.findOne(id, user.userId);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @Permission(Resource.CATEGORIES, Action.UPDATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update category by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Category ID' })
  @ApiBody({ type: Category })
  @ApiResponse({ status: 200, description: 'Category updated', type: Category })
  update(@CurrentUser() user: TokenPayload, @Param('id') id: string, @Body() data: Partial<Category>) {
    return this.categoriesService.update(id, { ...data, companyId: new Types.ObjectId(user.userId) }, user.userId);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Permission(Resource.CATEGORIES, Action.DELETE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete category by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  remove(@CurrentUser() user: TokenPayload, @Param('id') id: string) {
    return this.categoriesService.remove(id, user.userId);
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
  setStatus(@CurrentUser() user: TokenPayload, @Param('id') id: string, @Body('status') status: CategoryStatus) {
    return this.categoriesService.setStatus(id, status, user.userId);
  }

  @Get('parent/:parentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get categories by parent ID' })
  @ApiParam({ name: 'parentId', type: 'string', description: 'Parent category ID' })
  @ApiResponse({ status: 200, description: 'List of child categories', type: [Category] })
  findByParentId(@CurrentUser() user: TokenPayload, @Param('parentId') parentId: string) {
    return this.categoriesService.findByParentId(parentId, user.userId);
  }
}
