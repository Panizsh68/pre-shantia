import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from './entities/category.entity';
import { Model } from 'mongoose';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';
import { CategoryRepository, ICategoryRepository } from './repositories/categories.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }])],
  controllers: [CategoriesController],
  providers: [
    {
      provide: 'CategoryRepository',
      useFactory: (categoryModel: Model<Category>): ICategoryRepository => {
        return new CategoryRepository(categoryModel);
      },
      inject: [getModelToken(Category.name)],
    },
    {
      provide: 'ICategoryService',
      useClass: CategoriesService,
    },
  ],
  exports: ['ICategoryService'],
})
export class CategoriesModule {}
