import { DeleteResult, UpdateResult } from "mongoose";
import { CreateCompanyDto } from "../dto/create-company.dto";
import { UpdateCompanyDto } from "../dto/update-company.dto";
import { Company } from "../entities/company.entity";
import { QueryOptionsDto } from "src/utils/query-options.dto";

export interface ICompanyService { 
    create(createCompanyDto: CreateCompanyDto): Promise<Company>,
    findAll(options: QueryOptionsDto): Promise<Company[]>,
    findOne(id: string): Promise<Company | null>,
    update(id: string, updateCompanyDto: UpdateCompanyDto): Promise<Company | null>,
    remove(id: string): Promise<boolean>
}