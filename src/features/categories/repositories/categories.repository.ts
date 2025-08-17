import { Injectable } from '@nestjs/common';
import { IBaseCrudRepository } from 'src/libs/repository/interfaces/base-repo.interfaces';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';
import { ICategory } from '../interfaces/category.interface';

export interface ICategoryRepository extends IBaseCrudRepository<ICategory> { }

@Injectable()
export class CategoryRepository
  extends BaseCrudRepository<ICategory>
  implements ICategoryRepository { }
