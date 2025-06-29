import { IBaseCrudRepository } from 'src/libs/repository/interfaces/base-repo.interfaces';
import { Company } from '../entities/company.entity';
import { Injectable } from '@nestjs/common';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';

export interface ICompanyRepository extends IBaseCrudRepository<Company> {}

@Injectable()
export class CompanyRepository extends BaseCrudRepository<Company> implements ICompanyRepository {}
