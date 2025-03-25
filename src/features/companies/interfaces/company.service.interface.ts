import { DeleteResult, UpdateResult } from "mongoose";
import { CreateCompanyDto } from "../dto/create-company.dto";
import { UpdateCompanyDto } from "../dto/update-company.dto";
import { Company } from "../entities/company.entity";

export interface ICompanyService { 
    createCompany(createCompanyDto: CreateCompanyDto): Promise<Company>,
    findAllCompanies(): Promise<Company[]>,
    findOneCompany(id: string): Promise<Company>,
    updateCompany(id: string, updateCompanyDto: UpdateCompanyDto): Promise<UpdateResult>,
    removeCompany(id: string): Promise<DeleteResult>
}