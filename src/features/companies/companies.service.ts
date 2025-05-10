import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from './entities/company.entity';
import { DeleteResult, Model, UpdateResult } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ICompanyService } from './interfaces/company.service.interface';
import { CompanyRepository } from './repositories/company.repository';
import { QueryOptionsDto } from 'src/utils/query-options.dto';

@Injectable()
export class CompaniesService implements ICompanyService {
  constructor(@Inject('CompanyRepository') private readonly companyRepository: CompanyRepository ) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    const company = await this.companyRepository.create(createCompanyDto);
    return company
  }

  async findAll(options: QueryOptionsDto): Promise<Company[]> {
    const companies = await this.companyRepository.findAll(options);
    return companies
  }

  async findOne(id: string): Promise<Company | null> {
    const company = await this.companyRepository.findOne(id);
    return company
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto): Promise<Company | null> {
    const updatedCompany = await this.companyRepository.update(id, updateCompanyDto);
    return updatedCompany
  }

  async remove(id: string): Promise<boolean> {
    const deletedCompany = await this.companyRepository.delete(id);
    return deletedCompany
  }
}
