import { Injectable } from '@nestjs/common';
import { IBaseCrudRepository } from 'src/libs/repository/interfaces/base-repo.interfaces';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';
import { Category } from '../entities/category.entity';

export interface ICategoryRepository extends IBaseCrudRepository<Category> {}

@Injectable()
export class CategoryRepository
  extends BaseCrudRepository<Category>
  implements ICategoryRepository {}
