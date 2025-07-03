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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { TokenPayload } from '../auth/interfaces/token-payload.interface';
import { Category } from './entities/category.entity';
import { CategoryStatus } from './enums/category-status.enum';
import { ICategoryService } from './interfaces/category.service.interface';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(@Inject('ICategoryService') private readonly categoriesService: ICategoryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() data: Partial<Category>) {
    return this.categoriesService.create(data);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@CurrentUser() user: TokenPayload) {
    return this.categoriesService.findAll(user.userId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() data: Partial<Category>) {
    return this.categoriesService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  setStatus(@Param('id') id: string, @Body('status') status: CategoryStatus) {
    return this.categoriesService.setStatus(id, status);
  }

  @Get('parent/:parentId')
  @HttpCode(HttpStatus.OK)
  findByParentId(@Param('parentId') parentId: string) {
    return this.categoriesService.findByParentId(parentId);
  }
}
