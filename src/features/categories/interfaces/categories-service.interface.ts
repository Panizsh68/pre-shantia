import { QueryOptionsDto } from "src/utils/query-options.dto";
import { UpdateCategoryDto } from "../dto/update-category.dto";
import { Category } from "../entities/category.entity";
import { CreateCategoryDto } from "../dto/create-category.dto";

export interface ICategoryService {
    create(createCategoryDto: CreateCategoryDto): Promise<Category>,
    findAll(options: QueryOptionsDto): Promise<Category[]>,
    findOne(id: string): Promise<Category | null>,
    update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category | null>,
    remove(id: string): Promise<boolean>
}