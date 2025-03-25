import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from './entities/company.entity';
import { DeleteResult, Model, UpdateResult } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ICompanyService } from './interfaces/company.service.interface';

@Injectable()
export class CompaniesService implements ICompanyService {
  constructor(@InjectModel(Company.name) private readonly companyModel: Model<Company>) {}

  async createCompany(createCompanyDto: CreateCompanyDto): Promise<Company> {
    const company = await this.companyModel.create(createCompanyDto);
    return await company.save()
  }

  async findAllCompanies(): Promise<Company[]> {
    const companies = await this.companyModel.find();
    return companies
  }

  async findOneCompany(id: string): Promise<Company> {
    const company = await this.companyModel.findById(id);
    if (!company) throw new NotFoundException('company not found')
    return company
  }

  async updateCompany(id: string, updateCompanyDto: UpdateCompanyDto): Promise<UpdateResult> {
    const updatedCompany = await this.companyModel.updateOne({ _id: id }, updateCompanyDto);
    return updatedCompany
  }

  async removeCompany(id: string): Promise<DeleteResult> {
    const deletedCompany = await this.companyModel.deleteOne({ _id: id });
    return deletedCompany
  }
}
