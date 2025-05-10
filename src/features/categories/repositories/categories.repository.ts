import { Injectable } from "@nestjs/common";
import { Category } from "../entities/category.entity";
import { BaseRepository, IBaseRepository } from "src/utils/base.repository";

export interface ICategoryRepository extends IBaseRepository<Category> {} 


@Injectable()
export class CategoryRepository extends BaseRepository<Category> {}