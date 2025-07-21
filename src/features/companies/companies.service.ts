import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ICompanyRepository } from './repositories/company.repository';
import { Company } from './entities/company.entity';
import { ICompany } from './interfaces/company.interface';
import { ICompanyService } from './interfaces/company.service.interface';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService implements ICompanyService {
  constructor(
    @Inject('CompanyRepository') private readonly companyRepository: ICompanyRepository,
  ) {}

  async createCompany(createCompanyDto: CreateCompanyDto): Promise<ICompany> {
    return this.companyRepository.createOne(createCompanyDto);
  }

  async updateCompany(id: string, updateCompanyDto: UpdateCompanyDto): Promise<ICompany> {
    return this.companyRepository.updateById(id, updateCompanyDto);
  }

  async deleteCompany(id: string): Promise<void> {
    await this.companyRepository.deleteById(id);
  }

  async getCompanyById(id: string): Promise<ICompany> {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    return company;
  }

  async getAllCompanies(): Promise<ICompany[]> {
    return this.companyRepository.findAll();
  }
}
