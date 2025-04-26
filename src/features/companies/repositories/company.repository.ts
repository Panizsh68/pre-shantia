import { BaseRepository, IBaseRepository } from "src/utils/base.repository";
import { Company } from "../entities/company.entity";
import { Injectable } from "@nestjs/common";

export interface ICompanyRepository extends IBaseRepository<Company> {}

@Injectable()
export class CompanyRepository extends BaseRepository<Company> implements ICompanyRepository {}