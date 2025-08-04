import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ICompanyRepository } from './repositories/company.repository';
import { Company } from './entities/company.entity';
import { ICompany } from './interfaces/company.interface';
import { ICompanyService } from './interfaces/company.service.interface';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { FindManyOptions } from 'src/libs/repository/interfaces/base-repo-options.interface';
import { RequestContext } from 'src/common/types/request-context.interface';
import { Types } from 'mongoose';

@Injectable()
export class CompaniesService implements ICompanyService {
  constructor(
    @Inject('CompanyRepository') private readonly companyRepository: ICompanyRepository,
  ) { }

  async create(
    createCompanyDto: CreateCompanyDto,
    userId: string,
    ctx: RequestContext,
  ): Promise<ICompany> {
    const data: Partial<any> = {
      ...createCompanyDto,
      createdBy: new Types.ObjectId(userId),
      updatedBy: new Types.ObjectId(userId),
    };
    const companyDoc = await this.companyRepository.createOne(data);
    return companyDoc.toObject() as unknown as ICompany;
  }

  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
    userId: string,
  ): Promise<ICompany> {
    const existing = await this.companyRepository.findById(id);
    if (!existing) throw new NotFoundException(`Company with id ${id} not found`);
    if (existing.createdBy.toString() !== userId)
      throw new ForbiddenException('You do not have permission to update this company');
    const data: Partial<any> = {
      ...updateCompanyDto,
      updatedBy: new Types.ObjectId(userId),
    };
    const updatedDoc = await this.companyRepository.updateById(id, data);
    return updatedDoc.toObject() as unknown as ICompany;
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.companyRepository.findById(id);
    if (!existing) throw new NotFoundException(`Company with id ${id} not found`);
    if (existing.createdBy.toString() !== userId)
      throw new ForbiddenException('You do not have permission to delete this company');
    await this.companyRepository.deleteById(id);
  }

  async findOne(id: string): Promise<ICompany> {
    const companyDoc = await this.companyRepository.findById(id);
    if (!companyDoc) throw new NotFoundException(`Company with id ${id} not found`);
    return companyDoc.toObject() as unknown as ICompany;
  }

  async findAll(options: FindManyOptions = {}): Promise<ICompany[]> {
    const queryOptions: FindManyOptions = {
      ...options,
      populate: options.populate || ['createdBy', 'updatedBy'],
    };
    const companies = await this.companyRepository.findAll(queryOptions);
    return companies.map(doc => doc.toObject() as unknown as ICompany);
  }

  async existsByName(name: string): Promise<boolean> {
    return this.companyRepository.existsByCondition({ name });
  }

  async count(): Promise<number> {
    return this.companyRepository.countByCondition({});
  }
}
