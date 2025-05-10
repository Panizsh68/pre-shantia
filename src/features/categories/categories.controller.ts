import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Category } from './entities/category.entity';
import { ICategoryService } from './interfaces/categories-service.interface';

@ApiTags('دسته‌بندی‌ها')
@Controller('categories')
export class CategoriesController implements ICategoryService {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'ایجاد یک دسته‌بندی جدید' })
  @ApiResponse({ status: 201, description: 'دسته‌بندی با موفقیت ایجاد شد', type: Category })
  @ApiResponse({ status: 400, description: 'داده‌های ورودی نامعتبر' })
  create(@Body() createCategoryDto: CreateCategoryDto): Promise<Category> {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'دریافت تمام دسته‌بندی‌ها' })
  @ApiResponse({ status: 200, description: 'لیست دسته‌بندی‌ها', type: [Category] })
  findAll(): Promise<Category[]> {
    return this.categoriesService.findAll({});
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت یک دسته‌بندی با شناسه' })
  @ApiParam({ name: 'id', description: 'شناسه دسته‌بندی', example: '507f1f77bcf86cd799439012' })
  @ApiResponse({ status: 200, description: 'جزئیات دسته‌بندی', type: Category })
  @ApiResponse({ status: 404, description: 'دسته‌بندی یافت نشد' })
  findOne(@Param('id') id: string): Promise<Category> {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'به‌روزرسانی یک دسته‌بندی با شناسه' })
  @ApiParam({ name: 'id', description: 'شناسه دسته‌بندی', example: '507f1f77bcf86cd799439012' })
  @ApiResponse({ status: 200, description: 'دسته‌بندی به‌روزرسانی شد', type: Category })
  @ApiResponse({ status: 404, description: 'دسته‌بندی یافت نشد' })
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف یک دسته‌بندی با شناسه' })
  @ApiParam({ name: 'id', description: 'شناسه دسته‌بندی', example: '507f1f77bcf86cd799439012' })
  @ApiResponse({ status: 200, description: 'دسته‌بندی با موفقیت حذف شد', type: Boolean })
  @ApiResponse({ status: 404, description: 'دسته‌بندی یافت نشد' })
  remove(@Param('id') id: string): Promise<boolean> {
    return this.categoriesService.remove(id);
  }
}