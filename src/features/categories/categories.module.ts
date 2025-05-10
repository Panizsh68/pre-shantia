import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from './entities/category.entity';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/utils/base.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }]),
  ],
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    {
      provide: 'CategoryRepository',
      useFactory: (categoryModel: Model<Category>) => new BaseRepository<Category>(categoryModel),
      inject: [getModelToken(Category.name)],
    },
  ],
})
export class CategoriesModule {}
