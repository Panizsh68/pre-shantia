import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UsePipes, Query } from '@nestjs/common';
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
import { Product } from './entities/product.entity';
import { QueryOptionsDto } from 'src/utils/query-options.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';

@ApiTags('محصولات')
@Controller('products')
export class ProductsController implements IProductService {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UsePipes(RequestContextPipe)
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permissions([{ action: Action.create, resource: Resource.products }])
  @ApiOperation({ summary: 'ایجاد یک محصول جدید' })
  @ApiResponse({ status: 201, description: 'محصول با موفقیت ایجاد شد', type: Product })
  @ApiResponse({ status: 400, description: 'داده‌های ورودی نامعتبر' })
  @ApiResponse({ status: 403, description: 'عدم دسترسی' })
  create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'دریافت تمام محصولات با گزینه‌های صفحه‌بندی و مرتب‌سازی' })
  @ApiQuery({ name: 'options', type: QueryOptionsDto, required: false, description: 'گزینه‌های فیلتر و صفحه‌بندی' })
  @ApiResponse({ status: 200, description: 'لیست محصولات', type: [Product] })
  findAll(@Query() options: QueryOptionsDto): Promise<Product[]> {
    return this.productsService.findAll(options);
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت یک محصول با شناسه' })
  @ApiParam({ name: 'id', description: 'شناسه محصول', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'جزئیات محصول', type: Product })
  @ApiResponse({ status: 404, description: 'محصول یافت نشد' })
  findOne(@Param('id') id: string): Promise<Product> {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UsePipes(RequestContextPipe)
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permissions([{ action: Action.update, resource: Resource.products }])
  @ApiOperation({ summary: 'به‌روزرسانی یک محصول با شناسه' })
  @ApiParam({ name: 'id', description: 'شناسه محصول', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'محصول به‌روزرسانی شد', type: Product })
  @ApiResponse({ status: 404, description: 'محصول یافت نشد' })
  @ApiResponse({ status: 403, description: 'عدم دسترسی' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto): Promise<Product> {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UsePipes(RequestContextPipe)
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permissions([{ action: Action.delete, resource: Resource.products }])
  @ApiOperation({ summary: 'حذف یک محصول با شناسه' })
  @ApiParam({ name: 'id', description: 'شناسه محصول', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'محصول با موفقیت حذف شد', type: Boolean })
  @ApiResponse({ status: 404, description: 'محصول یافت نشد' })
  @ApiResponse({ status: 403, description: 'عدم دسترسی' })
  remove(@Param('id') id: string): Promise<boolean> {
    return this.productsService.remove(id);
  }
}