import { Company } from '../entities/company.entity';
import { ICompany } from './company.interface';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { UpdateCompanyDto } from '../dto/update-company.dto';
import { FindManyOptions } from 'src/libs/repository/interfaces/base-repo-options.interface';
import { RequestContext } from 'src/common/types/request-context.interface';

export interface ICompanyService {
  create(createCompanyDto: CreateCompanyDto, userId: string, ctx: RequestContext): Promise<ICompany>;
  update(id: string, updateCompanyDto: UpdateCompanyDto, userId: string): Promise<ICompany>;
  remove(id: string, userId: string): Promise<void>;
  findOne(id: string): Promise<ICompany>;
  findAll(options?: FindManyOptions): Promise<ICompany[]>;
  existsByName(name: string): Promise<boolean>;
  count(): Promise<number>;
}
