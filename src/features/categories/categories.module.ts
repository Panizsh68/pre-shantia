import { Module, forwardRef } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from './entities/category.entity';
import { Model } from 'mongoose';
import { CategoryRepository, ICategoryRepository } from './repositories/categories.repository';
import { ICategory } from './interfaces/category.interface';
import { PermissionsModule } from 'src/features/permissions/permissions.module';
import {
  BASE_AGGREGATE_REPOSITORY,
  BASE_TRANSACTION_REPOSITORY,
} from 'src/libs/repository/constants/tokens.constants';

@Module({
  imports: [MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }] as const), forwardRef(() => PermissionsModule)],
  controllers: [CategoriesController],
  providers: [
    {
      provide: 'CategoryRepository',
      useFactory: (categoryModel: Model<ICategory>, aggregateRepo, transactionRepo): ICategoryRepository => {
        return new CategoryRepository(categoryModel, aggregateRepo, transactionRepo);
      },
      inject: [getModelToken(Category.name), BASE_AGGREGATE_REPOSITORY, BASE_TRANSACTION_REPOSITORY],
    },
    {
      provide: 'ICategoryService',
      useClass: CategoriesService,
    },
  ],
  exports: ['ICategoryService'],
})
export class CategoriesModule { }
